package vn.haiphong.campaign;

import static org.junit.jupiter.api.Assertions.assertFalse;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;

class ArchitectureBoundaryTest {
    private static final List<String> FORBIDDEN_DOMAIN_IMPORTS = List.of(
            "import org.springframework.",
            "import jakarta.persistence.",
            "import jakarta.servlet.",
            "import java.sql."
    );

    @Test
    void domain_code_does_not_depend_on_framework_persistence_or_http() throws IOException {
        Path sources = Path.of("src", "main", "java");
        try (var files = Files.walk(sources)) {
            for (Path file : files.filter(this::isDomainJavaFile).toList()) {
                String source = Files.readString(file);
                for (String forbiddenImport : FORBIDDEN_DOMAIN_IMPORTS) {
                    assertFalse(
                            source.contains(forbiddenImport),
                            () -> file + " crosses the domain boundary with " + forbiddenImport
                    );
                }
            }
        }
    }

    @Test
    void application_code_does_not_import_infrastructure_or_web() throws IOException {
        Path sources = Path.of("src", "main", "java");
        try (var files = Files.walk(sources)) {
            for (Path file : files.filter(this::isApplicationJavaFile).toList()) {
                String source = Files.readString(file);
                assertFalse(
                        source.contains(".infrastructure.") || source.contains(".web."),
                        () -> file + " points outward from the application boundary"
                );
            }
        }
    }

    @Test
    void infrastructure_adapters_do_not_construct_http_view_models() throws IOException {
        Path sources = Path.of("src", "main", "java");
        try (var files = Files.walk(sources)) {
            for (Path file : files.filter(this::isInfrastructureJavaFile).toList()) {
                String source = Files.readString(file);
                boolean importsApplicationView = source.lines().anyMatch(line ->
                        line.startsWith("import ") && line.contains(".application.") && line.contains("View;")
                );
                assertFalse(
                        importsApplicationView,
                        () -> file + " couples persistence mapping to an HTTP/application view model"
                );
            }
        }
    }

    private boolean isDomainJavaFile(Path file) {
        String normalized = file.toString().replace('\\', '/');
        return normalized.endsWith(".java") && normalized.contains("/domain/");
    }

    private boolean isApplicationJavaFile(Path file) {
        String normalized = file.toString().replace('\\', '/');
        return normalized.endsWith(".java") && normalized.contains("/application/");
    }

    private boolean isInfrastructureJavaFile(Path file) {
        String normalized = file.toString().replace('\\', '/');
        return normalized.endsWith(".java") && normalized.contains("/infrastructure/");
    }
}
