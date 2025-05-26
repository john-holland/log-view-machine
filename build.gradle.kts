plugins {
    kotlin("jvm") version "1.9.0" apply false
    kotlin("plugin.serialization") version "1.9.0" apply false
}

allprojects {
    repositories {
        mavenCentral()
    }
}

subprojects {
    apply(plugin = "org.jetbrains.kotlin.jvm")
    apply(plugin = "org.jetbrains.kotlin.plugin.serialization")

    dependencies {
        implementation(kotlin("stdlib"))
        implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.5.1")
        implementation("com.graphql-java:graphql-java:21.0")
        implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
        
        testImplementation(kotlin("test"))
        testImplementation("org.junit.jupiter:junit-jupiter:5.9.2")
    }

    tasks.test {
        useJUnitPlatform()
    }

    kotlin {
        jvmToolchain(17)
    }
} 