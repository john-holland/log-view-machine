rootProject.name = "log-view-machine"

include(":core")
include(":adapters")
include(":graphql")
include(":example")

dependencyResolutionManagement {
    repositories {
        mavenCentral()
    }
} 