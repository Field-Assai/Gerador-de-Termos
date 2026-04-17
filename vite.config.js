import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

function historyApiPlugin() {
  return {
    name: 'history-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/history' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          const dataPath = path.join(process.cwd(), 'history.json');
          if (fs.existsSync(dataPath)) {
            try {
              const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
              // Retorna no máximo 6 registros
              res.end(JSON.stringify(data.slice(-6)));
            } catch(e) {
              res.end('[]');
            }
          } else {
            res.end('[]');
          }
        } else if (req.url === '/api/history' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const item = JSON.parse(body);
              const dataPath = path.join(process.cwd(), 'history.json');
              let data = [];
              
              if (fs.existsSync(dataPath)) {
                try {
                   data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
                } catch(err) {}
              }
              
              data.push(item);
              // Limita globalmente o arquivo em 6 para não inchar sem necessidade
              if (data.length > 6) {
                data = data.slice(data.length - 6);
              }
              
              fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
              
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch(e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [historyApiPlugin()]
});
