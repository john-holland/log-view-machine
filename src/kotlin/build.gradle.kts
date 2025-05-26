plugins {
    kotlin("jvm") version "1.9.0"
    id("org.jetbrains.kotlin.plugin.spring") version "1.9.0"
}

repositories {
    mavenCentral()
    maven {
        url = uri("https://artifactory.example.com/repo")
    }
}

dependencies {
    implementation("org.jetbrains.kotlin:kotlin-stdlib")
    implementation("com.logview:core:1.0.0")
    
    // Testing
    testImplementation("org.junit.jupiter:junit-jupiter:5.9.0")
    testImplementation("au.com.dius.pact.consumer:junit5:4.6.0")
    testImplementation("au.com.dius.pact.consumer:java8:4.6.0")
    testImplementation("org.mockito:mockito-core:5.0.0")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.0.0")
}

tasks.test {
    useJUnitPlatform()
} 