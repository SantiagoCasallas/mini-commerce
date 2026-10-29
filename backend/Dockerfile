FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml ./
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -B
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S commerce && adduser -S commerce -G commerce
COPY --from=build /build/target/mini-commerce-0.1.0.jar app.jar
USER commerce
EXPOSE 8080
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=65 -XX:+UseSerialGC"
ENTRYPOINT ["java", "-jar", "app.jar"]
