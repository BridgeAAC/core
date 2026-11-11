import SwiftUI
import UniformTypeIdentifiers

@main
struct BridgeAACApp: App {
    @StateObject private var bridgeCoordinator = BridgeNativeCoordinator()

    var body: some Scene {
        WindowGroup {
            ContentView(coordinator: bridgeCoordinator)
                .ignoresSafeArea()
                .onOpenURL { url in
                    bridgeCoordinator.handleIncomingFile(url: url)
                }
        }
    }
}
