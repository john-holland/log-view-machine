plugins {
    java
    application
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("com.graphql-java:graphql-java:21.0")
    implementation("io.reactivex.rxjava3:rxjava:3.1.8")
    implementation("org.slf4j:slf4j-api:2.0.9")
    implementation("org.slf4j:slf4j-simple:2.0.9")
    implementation("io.opentelemetry:opentelemetry-api:1.32.0")
    implementation("io.javalin:javalin:5.6.1")
    implementation("com.fasterxml.jackson.core:jackson-databind:2.15.2")
    implementation("com.h2database:h2:2.2.224")
    
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.1")
}

application {
    mainClass.set("com.mod.ecommerce.Application")
}

tasks.test {
    useJUnitPlatform()
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(20))
    }
}
