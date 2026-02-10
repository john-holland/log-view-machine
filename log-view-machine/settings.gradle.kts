rootProject.name = "log-view-machine"

include(":core")
include(":adapters")
include(":graphql")
include(":example")
include(":java")

dependencyResolutionManagement {
    repositories {
        mavenCentral()
    }
} 