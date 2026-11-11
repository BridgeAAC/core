// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "BridgeAAC",
    defaultLocalization: "en",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
    ],
    products: [
        .library(
            name: "BridgeAAC",
            targets: ["BridgeAAC"]
        ),
    ],
    targets: [
        .target(
            name: "BridgeAAC",
            resources: [
                .copy("Resources/WebBundle"),
                .copy("PrivacyInfo.xcprivacy")
            ]
        ),
    ]
)
