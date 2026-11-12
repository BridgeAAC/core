import SwiftUI
import WebKit
import AVFoundation
import UniformTypeIdentifiers

final class BridgeBundleSchemeHandler: NSObject, WKURLSchemeHandler {
    private static let mimeTypes: [String: String] = [
        "html": "text/html; charset=utf-8",
        "js": "text/javascript; charset=utf-8",
        "mjs": "text/javascript; charset=utf-8",
        "css": "text/css; charset=utf-8",
        "json": "application/json; charset=utf-8",
        "webmanifest": "application/manifest+json; charset=utf-8",
        "wasm": "application/wasm",
        "svg": "image/svg+xml",
        "png": "image/png",
        "ico": "image/x-icon",
        "woff2": "font/woff2",
        "wav": "audio/wav",
        "mp3": "audio/mpeg",
        "onnx": "application/octet-stream",
        "data": "application/octet-stream"
    ]

    static func minValidSize(for name: String) -> Int {
        if name.hasSuffix(".onnx") { return 1_000_000 }
        if name.hasSuffix(".data") { return 10_000_000 }
        if name.hasSuffix(".wasm") { return 100_000 }
        if name.hasSuffix(".json") { return 50 }
        return 16
    }

    static let allowedPiperFiles: [String] = [
        "__list__.json",
        "ar_JO-kareem-low.onnx",
        "ar_JO-kareem-low.onnx.json",
        "ar_JO-kareem-medium.onnx",
        "ar_JO-kareem-medium.onnx.json",
        "ca_ES-upc_ona-medium.onnx",
        "ca_ES-upc_ona-medium.onnx.json",
        "ca_ES-upc_ona-x_low.onnx",
        "ca_ES-upc_ona-x_low.onnx.json",
        "ca_ES-upc_pau-x_low.onnx",
        "ca_ES-upc_pau-x_low.onnx.json",
        "cs_CZ-jirka-low.onnx",
        "cs_CZ-jirka-low.onnx.json",
        "cs_CZ-jirka-medium.onnx",
        "cs_CZ-jirka-medium.onnx.json",
        "da_DK-talesyntese-medium.onnx",
        "da_DK-talesyntese-medium.onnx.json",
        "de_DE-eva_k-x_low.onnx",
        "de_DE-eva_k-x_low.onnx.json",
        "de_DE-karlsson-low.onnx",
        "de_DE-karlsson-low.onnx.json",
        "de_DE-kerstin-low.onnx",
        "de_DE-kerstin-low.onnx.json",
        "de_DE-mls-medium.onnx",
        "de_DE-mls-medium.onnx.json",
        "de_DE-pavoque-low.onnx",
        "de_DE-pavoque-low.onnx.json",
        "de_DE-ramona-low.onnx",
        "de_DE-ramona-low.onnx.json",
        "de_DE-thorsten-high.onnx",
        "de_DE-thorsten-high.onnx.json",
        "de_DE-thorsten-low.onnx",
        "de_DE-thorsten-low.onnx.json",
        "de_DE-thorsten-medium.onnx",
        "de_DE-thorsten-medium.onnx.json",
        "de_DE-thorsten_emotional-medium.onnx",
        "de_DE-thorsten_emotional-medium.onnx.json",
        "el_GR-rapunzelina-low.onnx",
        "el_GR-rapunzelina-low.onnx.json",
        "en_GB-alan-low.onnx",
        "en_GB-alan-low.onnx.json",
        "en_GB-alan-medium.onnx",
        "en_GB-alan-medium.onnx.json",
        "en_GB-alba-medium.onnx",
        "en_GB-alba-medium.onnx.json",
        "en_GB-aru-medium.onnx",
        "en_GB-aru-medium.onnx.json",
        "en_GB-cori-high.onnx",
        "en_GB-cori-high.onnx.json",
        "en_GB-cori-medium.onnx",
        "en_GB-cori-medium.onnx.json",
        "en_GB-jenny_dioco-medium.onnx",
        "en_GB-jenny_dioco-medium.onnx.json",
        "en_GB-northern_english_male-medium.onnx",
        "en_GB-northern_english_male-medium.onnx.json",
        "en_GB-semaine-medium.onnx",
        "en_GB-semaine-medium.onnx.json",
        "en_GB-southern_english_female-low.onnx",
        "en_GB-southern_english_female-low.onnx.json",
        "en_GB-vctk-medium.onnx",
        "en_GB-vctk-medium.onnx.json",
        "en_US-amy-low.onnx",
        "en_US-amy-low.onnx.json",
        "en_US-amy-medium.onnx",
        "en_US-amy-medium.onnx.json",
        "en_US-arctic-medium.onnx",
        "en_US-arctic-medium.onnx.json",
        "en_US-danny-low.onnx",
        "en_US-danny-low.onnx.json",
        "en_US-hfc_female-medium.onnx",
        "en_US-hfc_female-medium.onnx.json",
        "en_US-hfc_male-medium.onnx",
        "en_US-hfc_male-medium.onnx.json",
        "en_US-joe-medium.onnx",
        "en_US-joe-medium.onnx.json",
        "en_US-kathleen-low.onnx",
        "en_US-kathleen-low.onnx.json",
        "en_US-kristin-medium.onnx",
        "en_US-kristin-medium.onnx.json",
        "en_US-kusal-medium.onnx",
        "en_US-kusal-medium.onnx.json",
        "en_US-l2arctic-medium.onnx",
        "en_US-l2arctic-medium.onnx.json",
        "en_US-lessac-high.onnx",
        "en_US-lessac-high.onnx.json",
        "en_US-lessac-low.onnx",
        "en_US-lessac-low.onnx.json",
        "en_US-lessac-medium.onnx",
        "en_US-lessac-medium.onnx.json",
        "en_US-libritts-high.onnx",
        "en_US-libritts-high.onnx.json",
        "en_US-libritts_r-medium.onnx",
        "en_US-libritts_r-medium.onnx.json",
        "en_US-ljspeech-high.onnx",
        "en_US-ljspeech-high.onnx.json",
        "en_US-ljspeech-medium.onnx",
        "en_US-ljspeech-medium.onnx.json",
        "en_US-ryan-high.onnx",
        "en_US-ryan-high.onnx.json",
        "en_US-ryan-low.onnx",
        "en_US-ryan-low.onnx.json",
        "en_US-ryan-medium.onnx",
        "en_US-ryan-medium.onnx.json",
        "es_ES-carlfm-x_low.onnx",
        "es_ES-carlfm-x_low.onnx.json",
        "es_ES-davefx-medium.onnx",
        "es_ES-davefx-medium.onnx.json",
        "es_ES-mls_10246-low.onnx",
        "es_ES-mls_10246-low.onnx.json",
        "es_ES-mls_9972-low.onnx",
        "es_ES-mls_9972-low.onnx.json",
        "es_ES-sharvard-medium.onnx",
        "es_ES-sharvard-medium.onnx.json",
        "es_MX-ald-medium.onnx",
        "es_MX-ald-medium.onnx.json",
        "es_MX-claude-high.onnx",
        "es_MX-claude-high.onnx.json",
        "fa_IR-amir-medium.onnx",
        "fa_IR-amir-medium.onnx.json",
        "fa_IR-gyro-medium.onnx",
        "fa_IR-gyro-medium.onnx.json",
        "fi_FI-harri-low.onnx",
        "fi_FI-harri-low.onnx.json",
        "fi_FI-harri-medium.onnx",
        "fi_FI-harri-medium.onnx.json",
        "fr_FR-gilles-low.onnx",
        "fr_FR-gilles-low.onnx.json",
        "fr_FR-mls-medium.onnx",
        "fr_FR-mls-medium.onnx.json",
        "fr_FR-mls_1840-low.onnx",
        "fr_FR-mls_1840-low.onnx.json",
        "fr_FR-siwis-low.onnx",
        "fr_FR-siwis-low.onnx.json",
        "fr_FR-siwis-medium.onnx",
        "fr_FR-siwis-medium.onnx.json",
        "fr_FR-tom-medium.onnx",
        "fr_FR-tom-medium.onnx.json",
        "fr_FR-upmc-medium.onnx",
        "fr_FR-upmc-medium.onnx.json",
        "hu_HU-anna-medium.onnx",
        "hu_HU-anna-medium.onnx.json",
        "hu_HU-berta-medium.onnx",
        "hu_HU-berta-medium.onnx.json",
        "hu_HU-imre-medium.onnx",
        "hu_HU-imre-medium.onnx.json",
        "is_IS-bui-medium.onnx",
        "is_IS-bui-medium.onnx.json",
        "is_IS-salka-medium.onnx",
        "is_IS-salka-medium.onnx.json",
        "is_IS-steinn-medium.onnx",
        "is_IS-steinn-medium.onnx.json",
        "is_IS-ugla-medium.onnx",
        "is_IS-ugla-medium.onnx.json",
        "it_IT-riccardo-x_low.onnx",
        "it_IT-riccardo-x_low.onnx.json",
        "ka_GE-natia-medium.onnx",
        "ka_GE-natia-medium.onnx.json",
        "kk_KZ-iseke-x_low.onnx",
        "kk_KZ-iseke-x_low.onnx.json",
        "kk_KZ-issai-high.onnx",
        "kk_KZ-issai-high.onnx.json",
        "kk_KZ-raya-x_low.onnx",
        "kk_KZ-raya-x_low.onnx.json",
        "lb_LU-marylux-medium.onnx",
        "lb_LU-marylux-medium.onnx.json",
        "ne_NP-google-medium.onnx",
        "ne_NP-google-medium.onnx.json",
        "ne_NP-google-x_low.onnx",
        "ne_NP-google-x_low.onnx.json",
        "nl_BE-nathalie-medium.onnx",
        "nl_BE-nathalie-medium.onnx.json",
        "nl_BE-nathalie-x_low.onnx",
        "nl_BE-nathalie-x_low.onnx.json",
        "nl_BE-rdh-medium.onnx",
        "nl_BE-rdh-medium.onnx.json",
        "nl_BE-rdh-x_low.onnx",
        "nl_BE-rdh-x_low.onnx.json",
        "nl_NL-mls-medium.onnx",
        "nl_NL-mls-medium.onnx.json",
        "nl_NL-mls_5809-low.onnx",
        "nl_NL-mls_5809-low.onnx.json",
        "nl_NL-mls_7432-low.onnx",
        "nl_NL-mls_7432-low.onnx.json",
        "no_NO-talesyntese-medium.onnx",
        "no_NO-talesyntese-medium.onnx.json",
        "ort-wasm-simd-threaded.wasm",
        "ort-wasm-simd.wasm",
        "ort-wasm-threaded.wasm",
        "ort-wasm.wasm",
        "piper_phonemize.data",
        "piper_phonemize.wasm",
        "pl_PL-darkman-medium.onnx",
        "pl_PL-darkman-medium.onnx.json",
        "pl_PL-gosia-medium.onnx",
        "pl_PL-gosia-medium.onnx.json",
        "pl_PL-mc_speech-medium.onnx",
        "pl_PL-mc_speech-medium.onnx.json",
        "pl_PL-mls_6892-low.onnx",
        "pl_PL-mls_6892-low.onnx.json",
        "pt_BR-edresson-low.onnx",
        "pt_BR-edresson-low.onnx.json",
        "pt_BR-faber-medium.onnx",
        "pt_BR-faber-medium.onnx.json",
        "pt_PT-tugão-medium.onnx",
        "pt_PT-tugão-medium.onnx.json",
        "ro_RO-mihai-medium.onnx",
        "ro_RO-mihai-medium.onnx.json",
        "ru_RU-denis-medium.onnx",
        "ru_RU-denis-medium.onnx.json",
        "ru_RU-dmitri-medium.onnx",
        "ru_RU-dmitri-medium.onnx.json",
        "ru_RU-irina-medium.onnx",
        "ru_RU-irina-medium.onnx.json",
        "ru_RU-ruslan-medium.onnx",
        "ru_RU-ruslan-medium.onnx.json",
        "sk_SK-lili-medium.onnx",
        "sk_SK-lili-medium.onnx.json",
        "sl_SI-artur-medium.onnx",
        "sl_SI-artur-medium.onnx.json",
        "sr_RS-serbski_institut-medium.onnx",
        "sr_RS-serbski_institut-medium.onnx.json",
        "sv_SE-nst-medium.onnx",
        "sv_SE-nst-medium.onnx.json",
        "sw_CD-lanfrica-medium.onnx",
        "sw_CD-lanfrica-medium.onnx.json",
        "tr_TR-dfki-medium.onnx",
        "tr_TR-dfki-medium.onnx.json",
        "tr_TR-fahrettin-medium.onnx",
        "tr_TR-fahrettin-medium.onnx.json",
        "tr_TR-fettah-medium.onnx",
        "tr_TR-fettah-medium.onnx.json",
        "uk_UA-lada-x_low.onnx",
        "uk_UA-lada-x_low.onnx.json",
        "uk_UA-ukrainian_tts-medium.onnx",
        "uk_UA-ukrainian_tts-medium.onnx.json",
        "vi_VN-25hours_single-low.onnx",
        "vi_VN-25hours_single-low.onnx.json",
        "vi_VN-vais1000-medium.onnx",
        "vi_VN-vais1000-medium.onnx.json",
        "vi_VN-vivos-x_low.onnx",
        "vi_VN-vivos-x_low.onnx.json",
        "voices.json",
        "zh_CN-huayan-medium.onnx",
        "zh_CN-huayan-medium.onnx.json",
        "zh_CN-huayan-x_low.onnx",
        "zh_CN-huayan-x_low.onnx.json"
    ]

    static func safePiperFileName(_ name: String) -> String? {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        guard !trimmed.contains("/"), !trimmed.contains("\\"), !trimmed.contains("..") else { return nil }
        guard let matched = allowedPiperFiles.first(where: { $0 == trimmed }) else { return nil }
        return matched
    }

    static func safeFileURL(in directory: URL, filename: String) -> URL? {
        guard let safeName = safePiperFileName(filename) else { return nil }
        let dirCanonical = directory.standardizedFileURL
        let targetURL = directory.appendingPathComponent(safeName).standardizedFileURL
        guard targetURL.path.hasPrefix(dirCanonical.path) else { return nil }
        return targetURL
    }

    static func piperCacheDirectory() -> URL? {
        guard let supportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else {
            return nil
        }
        var dir = supportDir.appendingPathComponent("PiperVoices", isDirectory: true)
        if !FileManager.default.fileExists(atPath: dir.path) {
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        }
        var resourceValues = URLResourceValues()
        resourceValues.isExcludedFromBackup = true
        try? dir.setResourceValues(resourceValues)
        return dir
    }

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(URLError(.badURL))
            return
        }

        let rawPath = url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let relativePath = rawPath.isEmpty ? "index.html" : rawPath

        if relativePath.hasPrefix("__piper_cache__/") {
            let fileName = String(relativePath.dropFirst("__piper_cache__/".count))
            handlePiperCacheRequest(url: url, fileName: fileName, task: urlSchemeTask)
            return
        }

        guard let bundleRoot = Self.locateWebBundleRoot() else {
            urlSchemeTask.didFailWithError(URLError(.fileDoesNotExist))
            return
        }

        let bundleCanonical = bundleRoot.standardizedFileURL.path
        let candidateURL = bundleRoot.appendingPathComponent(relativePath).standardizedFileURL
        var targetURL = candidateURL
        var isDir: ObjCBool = false

        let assetExtensions: Set<String> = [
            "js", "mjs", "wasm", "css", "json", "webmanifest",
            "png", "svg", "ico", "jpg", "jpeg", "webp", "woff2",
            "wav", "mp3", "onnx", "data"
        ]
        let isAssetRequest = assetExtensions.contains(candidateURL.pathExtension.lowercased())

        if !targetURL.path.hasPrefix(bundleCanonical) || !FileManager.default.fileExists(atPath: targetURL.path, isDirectory: &isDir) || isDir.boolValue {
            if isAssetRequest {
                sendStatus(404, url: url, task: urlSchemeTask)
                return
            }
            targetURL = bundleRoot.appendingPathComponent("index.html")
        }

        do {
            let data = try Data(contentsOf: targetURL)
            let ext = targetURL.pathExtension.lowercased()
            let mime = Self.mimeTypes[ext] ?? "application/octet-stream"
            let headers: [String: String] = [
                "Content-Type": mime,
                "Content-Length": "\(data.count)",
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=31536000, immutable"
            ]
            if let response = HTTPURLResponse(
                url: url,
                statusCode: 200,
                httpVersion: "HTTP/1.1",
                headerFields: headers
            ) {
                urlSchemeTask.didReceive(response)
                urlSchemeTask.didReceive(data)
                urlSchemeTask.didFinish()
            } else {
                urlSchemeTask.didFailWithError(URLError(.cannotParseResponse))
            }
        } catch {
            urlSchemeTask.didFailWithError(error)
        }
    }

    private func handlePiperCacheRequest(url: URL, fileName: String, task: WKURLSchemeTask) {
        guard let safeName = Self.safePiperFileName(fileName),
              let cacheDir = Self.piperCacheDirectory() else {
            sendStatus(404, url: url, task: task)
            return
        }

        if safeName == "__list__.json" {
            let files = (try? FileManager.default.contentsOfDirectory(atPath: cacheDir.path)) ?? []
            let fileSet = Set(files)
            var validModels: [String] = []
            for item in files where item.hasSuffix(".onnx") {
                let jsonName = item + ".json"
                guard fileSet.contains(jsonName) else { continue }
                guard let onnxURL = Self.safeFileURL(in: cacheDir, filename: item),
                      let jsonURL = Self.safeFileURL(in: cacheDir, filename: jsonName) else { continue }
                let onnxSize = (try? FileManager.default.attributesOfItem(atPath: onnxURL.path)[.size] as? Int) ?? 0
                let jsonSize = (try? FileManager.default.attributesOfItem(atPath: jsonURL.path)[.size] as? Int) ?? 0
                if onnxSize >= 1_000_000 && jsonSize >= 50 {
                    validModels.append(String(item.dropLast(5)))
                }
            }
            let payload = (try? JSONSerialization.data(withJSONObject: validModels)) ?? Data("[]".utf8)
            sendData(payload, mime: "application/json; charset=utf-8", url: url, task: task)
            return
        }

        guard let fileURL = Self.safeFileURL(in: cacheDir, filename: safeName) else {
            sendStatus(404, url: url, task: task)
            return
        }
        let minSize = Self.minValidSize(for: safeName)
        guard FileManager.default.fileExists(atPath: fileURL.path),
              let data = try? Data(contentsOf: fileURL, options: .mappedIfSafe),
              data.count >= minSize else {
            sendStatus(404, url: url, task: task)
            return
        }
        let ext = fileURL.pathExtension.lowercased()
        let mime = Self.mimeTypes[ext] ?? "application/octet-stream"
        sendData(data, mime: mime, url: url, task: task)
    }

    private func sendData(_ data: Data, mime: String, url: URL, task: WKURLSchemeTask) {
        let headers: [String: String] = [
            "Content-Type": mime,
            "Content-Length": "\(data.count)",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store"
        ]
        if let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers) {
            task.didReceive(response)
            task.didReceive(data)
            task.didFinish()
        } else {
            task.didFailWithError(URLError(.cannotParseResponse))
        }
    }

    private func sendStatus(_ code: Int, url: URL, task: WKURLSchemeTask) {
        let headers: [String: String] = [
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Length": "0",
            "Access-Control-Allow-Origin": "*"
        ]
        if let response = HTTPURLResponse(url: url, statusCode: code, httpVersion: "HTTP/1.1", headerFields: headers) {
            task.didReceive(response)
            task.didFinish()
        } else {
            task.didFailWithError(URLError(.fileDoesNotExist))
        }
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}

    static func locateWebBundleRoot() -> URL? {
        #if SWIFT_PACKAGE
        if let resURL = Bundle.module.resourceURL?.appendingPathComponent("WebBundle"),
           FileManager.default.fileExists(atPath: resURL.path) {
            return resURL
        }
        #endif
        if let mainRes = Bundle.main.resourceURL?.appendingPathComponent("WebBundle"),
           FileManager.default.fileExists(atPath: mainRes.path) {
            return mainRes
        }
        return Bundle.main.resourceURL
    }
}

@MainActor
final class BridgeNativeCoordinator: NSObject, ObservableObject, WKScriptMessageHandler, AVSpeechSynthesizerDelegate, AVAudioPlayerDelegate {
    weak var webView: WKWebView?
    private let synthesizer = AVSpeechSynthesizer()
    private var audioPlayer: AVAudioPlayer?
    private var activeSpeechId: Int = 0
    private var pendingFiles: [(name: String, base64: String)] = []
    private var isWebReady = false

    override init() {
        super.init()
        synthesizer.delegate = self
        configureAudioSession()
    }

    private func configureAudioSession() {
        #if os(iOS)
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers, .mixWithOthers])
            try session.setActive(true)
        } catch {
            print("[BridgeAAC] AVAudioSession setup warning: \(error)")
        }
        #endif
    }

    func serializedNativeVoicesJS() -> String {
        let voices = AVSpeechSynthesisVoice.speechVoices().map { v -> [String: Any] in
            [
                "identifier": v.identifier,
                "name": v.name,
                "lang": v.language,
                "quality": v.quality.rawValue,
                "default": v.language == AVSpeechSynthesisVoice.currentLanguageCode()
            ]
        }
        guard let data = try? JSONSerialization.data(withJSONObject: voices) else {
            return "window.__bridgeSwiftVoices = []; window.bridgeSwift = true;"
        }
        let b64 = data.base64EncodedString()
        return "try { window.__bridgeSwiftVoices = JSON.parse(decodeURIComponent(escape(atob('\(b64)')))); } catch (_) { window.__bridgeSwiftVoices = []; } window.bridgeSwift = true;"
    }

    func handleIncomingFile(url: URL) {
        let accessed = url.startAccessingSecurityScopedResource()
        defer {
            if accessed { url.stopAccessingSecurityScopedResource() }
        }
        guard let data = try? Data(contentsOf: url) else { return }
        let base64 = data.base64EncodedString()
        let filename = url.lastPathComponent
        if isWebReady, let webView = webView {
            sendFileToWeb(webView: webView, name: filename, base64: base64)
        } else {
            pendingFiles.append((name: filename, base64: base64))
        }
    }

    private func sendFileToWeb(webView: WKWebView, name: String, base64: String) {
        webView.callAsyncJavaScript(
            "if (window.__bridgeOpenFileFromNative) { window.__bridgeOpenFileFromNative(name, base64); }",
            arguments: ["name": name, "base64": base64],
            in: nil,
            in: .page,
            completionHandler: nil
        )
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "bridgeSwift",
              let body = message.body as? [String: Any],
              let action = body["action"] as? String else { return }

        switch action {
        case "ready":
            isWebReady = true
            if let webView = webView {
                for item in pendingFiles {
                    sendFileToWeb(webView: webView, name: item.name, base64: item.base64)
                }
                pendingFiles.removeAll()
            }

        case "speak":
            let id = body["id"] as? Int ?? 0
            let text = body["text"] as? String ?? ""
            let voiceId = body["voiceIdentifier"] as? String
            let lang = body["lang"] as? String ?? "en-US"
            let rate = Float(body["rate"] as? Double ?? 1.0)
            let pitch = Float(body["pitch"] as? Double ?? 1.0)
            let volume = Float(body["volume"] as? Double ?? 1.0)
            speakNative(id: id, text: text, voiceIdentifier: voiceId, lang: lang, rate: rate, pitch: pitch, volume: volume)

        case "playAudio":
            let id = body["id"] as? Int ?? 0
            let base64 = body["base64"] as? String ?? ""
            let rate = Float(body["rate"] as? Double ?? 1.0)
            let volume = Float(body["volume"] as? Double ?? 1.0)
            playAudioNative(id: id, base64: base64, rate: rate, volume: volume)

        case "stop":
            if synthesizer.isSpeaking {
                synthesizer.stopSpeaking(at: .immediate)
            }
            if let player = audioPlayer, player.isPlaying {
                player.stop()
                audioPlayer = nil
            }

        case "downloadPiperFile":
            guard let rawFilename = body["filename"] as? String,
                  !rawFilename.contains("/"),
                  !rawFilename.contains("\\"),
                  !rawFilename.contains(".."),
                  let validName = BridgeBundleSchemeHandler.safePiperFileName(rawFilename) else {
                let reqId = body["reqId"] as? String ?? ""
                emitPiperDownloadEvent(reqId: reqId, ok: false, size: 0, error: "Invalid filename")
                return
            }
            let reqId = body["reqId"] as? String ?? ""
            let urls = body["urls"] as? [String] ?? []
            let minSize = body["minSize"] as? Int ?? 16
            downloadPiperFileNative(reqId: reqId, filename: validName, urls: urls, minSize: minSize)

        case "savePiperFile":
            guard let rawFilename = body["filename"] as? String,
                  !rawFilename.contains("/"),
                  !rawFilename.contains("\\"),
                  !rawFilename.contains(".."),
                  let validName = BridgeBundleSchemeHandler.safePiperFileName(rawFilename) else {
                let reqId = body["reqId"] as? String ?? ""
                emitPiperDownloadEvent(reqId: reqId, ok: false, size: 0, error: "Invalid filename")
                return
            }
            let reqId = body["reqId"] as? String ?? ""
            let base64 = body["base64"] as? String ?? ""
            savePiperFileNative(reqId: reqId, filename: validName, base64: base64)

        case "deletePiperFile":
            let rawFilename = body["filename"] as? String ?? ""
            if rawFilename == "__all__" {
                deletePiperFileNative(filename: "__all__")
                return
            }
            guard !rawFilename.contains("/"),
                  !rawFilename.contains("\\"),
                  !rawFilename.contains(".."),
                  let validName = BridgeBundleSchemeHandler.safePiperFileName(rawFilename) else { return }
            deletePiperFileNative(filename: validName)

        case "haptic":
            #if os(iOS)
            let generator = UIImpactFeedbackGenerator(style: .light)
            generator.impactOccurred()
            #endif

        default:
            break
        }
    }

    private func playAudioNative(id: Int, base64: String, rate: Float, volume: Float) {
        configureAudioSession()
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
        if let existing = audioPlayer, existing.isPlaying {
            existing.stop()
        }
        activeSpeechId = id
        guard let audioData = Data(base64Encoded: base64, options: .ignoreUnknownCharacters),
              !audioData.isEmpty else {
            emitSpeechEvent(type: "error")
            return
        }
        do {
            let player = try AVAudioPlayer(data: audioData)
            player.delegate = self
            player.enableRate = true
            player.rate = min(max(rate, 0.5), 2.0)
            player.volume = min(max(volume, 0.0), 1.0)
            player.prepareToPlay()
            audioPlayer = player
            if player.play() {
                emitSpeechEvent(type: "start")
            } else {
                audioPlayer = nil
                emitSpeechEvent(type: "error")
            }
        } catch {
            audioPlayer = nil
            emitSpeechEvent(type: "error")
        }
    }

    private func downloadPiperFileNative(reqId: String, filename: String, urls: [String], minSize: Int) {
        guard !filename.contains("/"),
              !filename.contains("\\"),
              !filename.contains(".."),
              let cacheDir = BridgeBundleSchemeHandler.piperCacheDirectory(),
              let destURL = BridgeBundleSchemeHandler.safeFileURL(in: cacheDir, filename: filename) else {
            emitPiperDownloadEvent(reqId: reqId, ok: false, size: 0, error: "Invalid cache directory")
            return
        }
        if FileManager.default.fileExists(atPath: destURL.path),
           let attrs = try? FileManager.default.attributesOfItem(atPath: destURL.path),
           let existingSize = attrs[.size] as? Int,
           existingSize >= minSize {
            emitPiperDownloadEvent(reqId: reqId, ok: true, size: existingSize, error: nil)
            return
        }

        Task.detached(priority: .userInitiated) { [weak self] in
            var lastError = "Download failed"
            for rawURL in urls {
                guard let candidateURL = URL(string: rawURL) else { continue }
                for attempt in 0..<3 {
                    do {
                        var request = URLRequest(url: candidateURL)
                        request.timeoutInterval = 120
                        let (tempURL, response) = try await URLSession.shared.download(for: request)
                        if let httpResp = response as? HTTPURLResponse, !(200...299).contains(httpResp.statusCode) {
                            lastError = "HTTP \(httpResp.statusCode)"
                            try? FileManager.default.removeItem(at: tempURL)
                            continue
                        }
                        let attrs = try? FileManager.default.attributesOfItem(atPath: tempURL.path)
                        let fileSize = (attrs?[.size] as? Int) ?? 0
                        if fileSize < minSize {
                            lastError = "Incomplete file (\(fileSize) bytes)"
                            try? FileManager.default.removeItem(at: tempURL)
                            continue
                        }
                        if FileManager.default.fileExists(atPath: destURL.path) {
                            try? FileManager.default.removeItem(at: destURL)
                        }
                        try FileManager.default.moveItem(at: tempURL, to: destURL)
                        var rv = URLResourceValues()
                        rv.isExcludedFromBackup = true
                        var mutableDest = destURL
                        try? mutableDest.setResourceValues(rv)
                        let capturedSize = fileSize
                        await MainActor.run {
                            self?.emitPiperDownloadEvent(reqId: reqId, ok: true, size: capturedSize, error: nil)
                        }
                        return
                    } catch {
                        lastError = error.localizedDescription
                        if attempt < 2 {
                            try? await Task.sleep(nanoseconds: UInt64(450_000_000 * (attempt + 1)))
                        }
                    }
                }
            }
            let finalError = lastError
            await MainActor.run {
                self?.emitPiperDownloadEvent(reqId: reqId, ok: false, size: 0, error: finalError)
            }
        }
    }

    private func savePiperFileNative(reqId: String, filename: String, base64: String) {
        guard !filename.contains("/"),
              !filename.contains("\\"),
              !filename.contains(".."),
              let cacheDir = BridgeBundleSchemeHandler.piperCacheDirectory(),
              let destURL = BridgeBundleSchemeHandler.safeFileURL(in: cacheDir, filename: filename),
              let data = Data(base64Encoded: base64, options: .ignoreUnknownCharacters) else {
            emitPiperDownloadEvent(reqId: reqId, ok: false, size: 0, error: "Invalid data")
            return
        }
        var mutableDest = destURL
        do {
            try data.write(to: mutableDest, options: .atomic)
            var rv = URLResourceValues()
            rv.isExcludedFromBackup = true
            try? mutableDest.setResourceValues(rv)
            emitPiperDownloadEvent(reqId: reqId, ok: true, size: data.count, error: nil)
        } catch {
            emitPiperDownloadEvent(reqId: reqId, ok: false, size: 0, error: error.localizedDescription)
        }
    }

    private func deletePiperFileNative(filename: String) {
        guard let cacheDir = BridgeBundleSchemeHandler.piperCacheDirectory() else { return }
        if filename == "__all__" {
            let items = (try? FileManager.default.contentsOfDirectory(at: cacheDir, includingPropertiesForKeys: nil)) ?? []
            for item in items {
                try? FileManager.default.removeItem(at: item)
            }
            return
        }
        guard !filename.contains("/"),
              !filename.contains("\\"),
              !filename.contains(".."),
              let target = BridgeBundleSchemeHandler.safeFileURL(in: cacheDir, filename: filename) else { return }
        try? FileManager.default.removeItem(at: target)
    }

    private func emitPiperDownloadEvent(reqId: String, ok: Bool, size: Int, error: String?) {
        var payload: [String: Any] = ["reqId": reqId, "ok": ok, "size": size]
        if let error = error { payload["error"] = error }
        webView?.callAsyncJavaScript(
            "if (window.__bridgeOnPiperDownload) { window.__bridgeOnPiperDownload(payload); }",
            arguments: ["payload": payload],
            in: nil,
            in: .page,
            completionHandler: nil
        )
    }

    private func speakNative(
        id: Int,
        text: String,
        voiceIdentifier: String?,
        lang: String,
        rate: Float,
        pitch: Float,
        volume: Float
    ) {
        configureAudioSession()
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
        if let player = audioPlayer, player.isPlaying {
            player.stop()
            audioPlayer = nil
        }
        activeSpeechId = id
        let utterance = AVSpeechUtterance(string: text)
        if let voiceId = voiceIdentifier, let matched = AVSpeechSynthesisVoice(identifier: voiceId) {
            utterance.voice = matched
        } else if let langVoice = AVSpeechSynthesisVoice(language: lang) {
            utterance.voice = langVoice
        }
        let scaledRate = AVSpeechUtteranceDefaultSpeechRate * min(max(rate, 0.4), 2.0)
        utterance.rate = min(max(scaledRate, AVSpeechUtteranceMinimumSpeechRate), AVSpeechUtteranceMaximumSpeechRate)
        utterance.pitchMultiplier = min(max(pitch, 0.5), 2.0)
        utterance.volume = min(max(volume, 0.0), 1.0)
        synthesizer.speak(utterance)
    }

    nonisolated func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        Task { @MainActor in
            emitSpeechEvent(type: flag ? "end" : "error")
        }
    }

    nonisolated func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        Task { @MainActor in
            emitSpeechEvent(type: "error")
        }
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didStart utterance: AVSpeechUtterance) {
        Task { @MainActor in
            emitSpeechEvent(type: "start")
        }
    }

    nonisolated func speechSynthesizer(
        _ synthesizer: AVSpeechSynthesizer,
        willSpeakRangeOfSpeechString characterRange: NSRange,
        utterance: AVSpeechUtterance
    ) {
        let idx = characterRange.location
        let len = characterRange.length
        Task { @MainActor in
            emitSpeechEvent(type: "boundary", charIndex: idx, charLength: len)
        }
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        Task { @MainActor in
            emitSpeechEvent(type: "end")
        }
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        Task { @MainActor in
            emitSpeechEvent(type: "end")
        }
    }

    private func emitSpeechEvent(type: String, charIndex: Int? = nil, charLength: Int? = nil) {
        var payload: [String: Any] = ["id": activeSpeechId, "type": type]
        if let charIndex = charIndex { payload["charIndex"] = charIndex }
        if let charLength = charLength { payload["charLength"] = charLength }
        webView?.callAsyncJavaScript(
            "if (window.__bridgeOnSwiftSpeechEvent) { window.__bridgeOnSwiftSpeechEvent(payload); }",
            arguments: ["payload": payload],
            in: nil,
            in: .page,
            completionHandler: nil
        )
    }
}

#if os(iOS)
struct ContentView: UIViewRepresentable {
    @ObservedObject var coordinator: BridgeNativeCoordinator

    func makeUIView(context: Context) -> WKWebView {
        let webView = createConfiguredWebView(coordinator: coordinator)
        coordinator.webView = webView
        loadInitialBundle(into: webView)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
#elseif os(macOS)
struct ContentView: NSViewRepresentable {
    @ObservedObject var coordinator: BridgeNativeCoordinator

    func makeNSView(context: Context) -> WKWebView {
        let webView = createConfiguredWebView(coordinator: coordinator)
        coordinator.webView = webView
        loadInitialBundle(into: webView)
        return webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {}
}
#endif

@MainActor
private func createConfiguredWebView(coordinator: BridgeNativeCoordinator) -> WKWebView {
    let config = WKWebViewConfiguration()
    let schemeHandler = BridgeBundleSchemeHandler()
    config.setURLSchemeHandler(schemeHandler, forURLScheme: "bridgeaac")

    let contentController = WKUserContentController()
    let preloadScript = WKUserScript(
        source: coordinator.serializedNativeVoicesJS(),
        injectionTime: .atDocumentStart,
        forMainFrameOnly: true
    )
    contentController.addUserScript(preloadScript)
    contentController.add(coordinator, name: "bridgeSwift")
    config.userContentController = contentController
    config.websiteDataStore = .default()
    config.preferences.javaScriptCanOpenWindowsAutomatically = false

    #if os(iOS)
    config.allowsInlineMediaPlayback = true
    config.mediaTypesRequiringUserActionForPlayback = []
    #endif

    let webView = WKWebView(frame: .zero, configuration: config)
    #if os(iOS)
    webView.scrollView.isScrollEnabled = false
    webView.scrollView.bounces = false
    webView.scrollView.contentInsetAdjustmentBehavior = .never
    webView.isOpaque = false
    webView.backgroundColor = UIColor(red: 221/255, green: 227/255, blue: 238/255, alpha: 1.0)
    #endif
    return webView
}

@MainActor
private func loadInitialBundle(into webView: WKWebView) {
    var components = URLComponents()
    components.scheme = "bridgeaac"
    components.host = "app"
    components.path = "/index.html"
    if let url = components.url {
        webView.load(URLRequest(url: url))
    }
}
