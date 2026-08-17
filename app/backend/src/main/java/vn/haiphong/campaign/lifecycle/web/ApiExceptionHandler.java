package vn.haiphong.campaign.lifecycle.web;

import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import vn.haiphong.campaign.lifecycle.application.IdempotencyConflict;
import vn.haiphong.campaign.lifecycle.application.OptimisticConflict;
import vn.haiphong.campaign.lifecycle.domain.DomainRuleViolation;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(DomainRuleViolation.class)
    ProblemDetail domainRule(DomainRuleViolation exception) {
        return problem(HttpStatus.UNPROCESSABLE_CONTENT, exception.code(), exception.getMessage());
    }

    @ExceptionHandler(OptimisticConflict.class)
    ProblemDetail optimisticConflict(OptimisticConflict exception) {
        return problem(HttpStatus.CONFLICT, "VERSION_CONFLICT", exception.getMessage());
    }

    @ExceptionHandler(IdempotencyConflict.class)
    ProblemDetail idempotencyConflict(IdempotencyConflict exception) {
        return problem(HttpStatus.CONFLICT, "IDEMPOTENCY_CONFLICT", exception.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    ProblemDetail accessDenied(AccessDeniedException exception) {
        return problem(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Tài khoản không có quyền trên tài nguyên này.");
    }

    @ExceptionHandler(AuthenticationCredentialsNotFoundException.class)
    ProblemDetail unauthenticated(AuthenticationCredentialsNotFoundException exception) {
        return problem(
                HttpStatus.UNAUTHORIZED,
                "AUTHENTICATION_REQUIRED",
                "Phiên đăng nhập đã hết hạn hoặc chưa được xác thực."
        );
    }

    @ExceptionHandler(BadCredentialsException.class)
    ProblemDetail badCredentials(BadCredentialsException exception) {
        return problem(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Tên đăng nhập hoặc mật khẩu không đúng.");
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    ProblemDetail missingHeader(MissingRequestHeaderException exception) {
        String code = "Idempotency-Key".equalsIgnoreCase(exception.getHeaderName())
                ? "IDEMPOTENCY_KEY_REQUIRED"
                : "REQUEST_HEADER_REQUIRED";
        return problem(HttpStatus.BAD_REQUEST, code, "Thiếu header bắt buộc: " + exception.getHeaderName());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ProblemDetail unreadableBody(HttpMessageNotReadableException exception) {
        return problem(HttpStatus.BAD_REQUEST, "INVALID_REQUEST_BODY", "Nội dung JSON không hợp lệ.");
    }

    private static ProblemDetail problem(HttpStatus status, String code, String detail) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setType(URI.create("https://local.invalid/problems/" + code.toLowerCase().replace('_', '-')));
        problem.setTitle(status.getReasonPhrase());
        problem.setProperty("code", code);
        return problem;
    }
}
