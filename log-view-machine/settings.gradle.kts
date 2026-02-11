rootProject.name = "log-view-machine"

include(":core")
include(":adapters")
include(":graphql")
include(":example")
include(":java")
// Example module lives at workspace root ../example when building from log-view-machine/
project(":example").projectDir = file("../example")

dependencyResolutionManagement {
    repositories {
        mavenCentral()
    }
} 