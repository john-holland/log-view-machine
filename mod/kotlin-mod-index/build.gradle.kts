plugins {
    kotlin("jvm") version "1.9.0"
    kotlin("plugin.serialization") version "1.9.0"
    application
    id("com.mod.cave-adapters")
}

repositories {
    mavenCentral()
}

sourceSets {
    main {
        kotlin {
            exclude("**/demo/**")
        }
    }
}

dependencies {
    implementation(kotlin("stdlib"))
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
    implementation("com.graphql-java:graphql-java:21.0")
    
    // Retrofit2 for dotCMS integration
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    
    testImplementation(kotlin("test"))
    testImplementation("org.junit.jupiter:junit-jupiter:5.9.2")
}

application {
    mainClass.set("com.mod.index.server.ModIndexServerKt")
}

caveAdapters {
    port.set(8082)
    waitForHealthUrl.set("http://127.0.0.1:3000/health")
    waitForHealthTimeoutMs.set(120_000)
}

tasks.test {
    useJUnitPlatform()
}

kotlin {
    // Use 17 for compatibility with Gradle 8.9 and common JDK installs (Java 25+ may be unsupported)
    jvmToolchain(17)
} 