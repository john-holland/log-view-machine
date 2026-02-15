plugins {
    kotlin("jvm") version "1.9.0"
    id("java-gradle-plugin")
}

group = "com.mod"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    gradleApi()
    implementation(project(":adapters"))
    testImplementation(kotlin("test"))
}

gradlePlugin {
    plugins {
        create("caveAdapters") {
            id = "com.mod.cave-adapters"
            implementationClass = "com.mod.cave.gradle.CaveAdaptersPlugin"
        }
    }
}

kotlin {
    jvmToolchain(17)
}
