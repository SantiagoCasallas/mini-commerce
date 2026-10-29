FROM node:24-alpine AS frontend
WORKDIR /ui
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build
FROM maven:3.9-eclipse-temurin-21 AS backend
WORKDIR /build
COPY backend/pom.xml ./
RUN mvn dependency:go-offline -B
COPY backend/src ./src
COPY --from=frontend /ui/dist/mini-commerce/browser/ ./src/main/resources/static/
RUN mvn package -B
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S commerce && adduser -S commerce -G commerce
COPY --from=backend /build/target/mini-commerce-0.1.0.jar app.jar
USER commerce
EXPOSE 8080
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=65 -XX:+UseSerialGC"
ENTRYPOINT ["java","-jar","app.jar"]
