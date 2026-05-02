// Screen capture — Phase 1 only does macOS desktop capture via `screencapture`.
// Linux + UVC capture cards are stubs in this version (Phase 2).

import { z } from "zod";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

interface CaptureSettings {
  source: "desktop" | "capture" | "webcam";
  region?: { x: number; y: number; w: number; h: number };
  device?: string;
  maxDim: number;
}

const settings: CaptureSettings = {
  source: "desktop",
  maxDim: 1024,
};

let lastHash: string | null = null;

function captureMacosDesktop(region?: CaptureSettings["region"]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const dir = mkdtempSync(join(tmpdir(), "joypad-mcp-"));
    const out = join(dir, "shot.png");
    const args = ["-x", "-t", "png"];
    if (region) args.push("-R", `${region.x},${region.y},${region.w},${region.h}`);
    args.push(out);
    const proc = spawn("screencapture", args, { stdio: "ignore" });
    proc.on("error", reject);
    proc.on("exit", (code) => {
      if (code !== 0) return reject(new Error(`screencapture exited ${code}`));
      try {
        const buf = readFileSync(out);
        try { unlinkSync(out); } catch {}
        resolve(buf);
      } catch (e) {
        reject(e);
      }
    });
  });
}

// djb2 over the PNG bytes — coarse change-detection. Not a perceptual hash;
// good enough for "did the screen change at all". Phase 2 can swap in pHash.
function quickHash(buf: Buffer): string {
  let h = 5381;
  // Sample every 64th byte to keep this fast on big images
  for (let i = 0; i < buf.length; i += 64) h = (((h << 5) + h) ^ buf[i]) >>> 0;
  return `${buf.length}:${h.toString(16)}`;
}

async function capture(): Promise<{ png: Buffer; hash: string }> {
  let png: Buffer;
  if (settings.source === "desktop") {
    if (process.platform !== "darwin") {
      throw new Error("desktop capture currently only implemented on macOS — set source to 'capture' or 'webcam' (Phase 2)");
    }
    png = await captureMacosDesktop(settings.region);
  } else {
    throw new Error(`capture source '${settings.source}' not implemented yet (Phase 2 — needs ffmpeg avfoundation)`);
  }
  return { png, hash: quickHash(png) };
}

export function registerVisionTools(server: McpServer): void {
  server.tool(
    "set_capture_source",
    "Configure where `screenshot` reads from. `desktop` uses the OS screencapture (macOS only in Phase 1). `region` crops to a rectangle, useful when an emulator window is on a known part of the screen.",
    {
      source: z.enum(["desktop", "capture", "webcam"]),
      device: z.string().optional().describe("UVC device name for capture/webcam (Phase 2)"),
      region: z
        .object({ x: z.number().int(), y: z.number().int(), w: z.number().int().positive(), h: z.number().int().positive() })
        .optional(),
      max_dim: z.number().int().positive().optional(),
    },
    async ({ source, device, region, max_dim }) => {
      settings.source = source;
      settings.device = device;
      settings.region = region;
      if (max_dim) settings.maxDim = max_dim;
      lastHash = null;
      return { content: [{ type: "text", text: JSON.stringify({ ok: true, settings }, null, 2) }] };
    },
  );

  server.tool(
    "screenshot",
    "Take a screenshot of the configured source and return it as an image. The assistant sees the pixels on its next turn.",
    {},
    async () => {
      const { png, hash } = await capture();
      lastHash = hash;
      return {
        content: [
          { type: "image", data: png.toString("base64"), mimeType: "image/png" },
          { type: "text", text: JSON.stringify({ bytes: png.length, hash, source: settings.source }) },
        ],
      };
    },
  );

  server.tool(
    "screenshot_diff",
    "Take a screenshot only if it has changed since the last `screenshot` or `screenshot_diff` call. Saves tokens during cutscenes/static menus. Returns `{changed:false}` if unchanged.",
    {},
    async () => {
      const { png, hash } = await capture();
      if (hash === lastHash) {
        return { content: [{ type: "text", text: JSON.stringify({ changed: false, hash }) }] };
      }
      lastHash = hash;
      return {
        content: [
          { type: "image", data: png.toString("base64"), mimeType: "image/png" },
          { type: "text", text: JSON.stringify({ changed: true, bytes: png.length, hash, source: settings.source }) },
        ],
      };
    },
  );
}
