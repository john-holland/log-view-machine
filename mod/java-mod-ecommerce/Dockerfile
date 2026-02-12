# Build stage
FROM gradle:8.5-jdk20 AS build
WORKDIR /app
COPY build.gradle.kts settings.gradle.kts ./
COPY src ./src
RUN gradle build --no-daemon -x test

# Runtime stage
FROM openjdk:20-jdk-slim
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8083
ENV PORT=8083
CMD ["java", "-jar", "app.jar"]
