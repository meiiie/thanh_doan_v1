# syntax=docker/dockerfile:1.7
FROM maven:3.9.11-eclipse-temurin-21-alpine AS build
WORKDIR /workspace
COPY pom.xml ./
RUN --mount=type=cache,target=/root/.m2 mvn -B -q dependency:go-offline
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -B -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine
RUN apk upgrade --no-cache \
    && addgroup -S campaign \
    && adduser -S campaign -G campaign
WORKDIR /app
COPY --from=build --chown=campaign:campaign /workspace/target/neko-doan-backend-*.jar app.jar
USER campaign
EXPOSE 8081 9090
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-XX:+ExitOnOutOfMemoryError", "-Djava.security.egd=file:/dev/urandom", "-jar", "/app/app.jar"]
