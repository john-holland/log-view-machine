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
    if (name != "java") {
        apply(plugin = "org.jetbrains.kotlin.jvm")
        apply(plugin = "org.jetbrains.kotlin.plugin.serialization")

        configure<org.jetbrains.kotlin.gradle.dsl.KotlinJvmProjectExtension> {
            jvmToolchain(17)
        }

        dependencies {
            add("implementation", kotlin("stdlib"))
            add("implementation", "org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
            add("implementation", "com.graphql-java:graphql-java:21.0")
            add("implementation", "org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
            add("testImplementation", kotlin("test"))
            add("testImplementation", "org.junit.jupiter:junit-jupiter:5.9.2")
        }

        tasks.named<Test>("test") {
            useJUnitPlatform()
        }
    }
} 