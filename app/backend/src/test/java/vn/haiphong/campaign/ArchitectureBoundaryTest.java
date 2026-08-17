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

    private boolean isDomainJavaFile(Path file) {
        String normalized = file.toString().replace('\\', '/');
        return normalized.endsWith(".java") && normalized.contains("/domain/");
    }
}
