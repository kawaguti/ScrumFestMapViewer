
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class ClientSideRoutingHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # If path starts with /event/, serve index.html
        if self.path.startswith('/event/'):
            self.path = '/index.html'
        self.send_response(200)
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        return SimpleHTTPRequestHandler.do_GET(self)

if __name__ == '__main__':
    server_address = ('0.0.0.0', 3000)
    httpd = HTTPServer(server_address, ClientSideRoutingHandler)
    print('Server running on port 3000...')
    httpd.serve_forever()
