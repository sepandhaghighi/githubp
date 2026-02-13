# -*- coding: utf-8 -*-

import http.server
import socketserver
import os
import sys

PORT = 8000


class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            self.send_response(404)
            self.send_header("Content-Type", "text/html")
            self.end_headers()

            path_404 = os.path.join(DIRECTORY, "404.html")
            if os.path.exists(path_404):
                with open(path_404, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.wfile.write(b"<h1>404 Not Found</h1>")
        else:
            super().send_error(code, message, explain)


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


def main():
    with ReusableTCPServer(("", PORT), CustomHandler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
        finally:
            httpd.server_close()
            print("Server stopped.")
            sys.exit(0)


if __name__ == "__main__":
    main()
