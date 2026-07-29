import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // node-seal carrega WebAssembly; precisa ficar fora do empacotador.
  serverExternalPackages: ["node-seal"],

  turbopack: {
    /**
     * Sem isto o Next sobe um nível e escolhe a raiz do repositório como pasta
     * de trabalho, porque existe um arquivo de lock lá também. O efeito é ele
     * passar a vigiar `target/` — o diretório de compilação do Rust, com
     * milhares de arquivos — e o servidor de desenvolvimento estourar a memória
     * sozinho, ocioso, sem ninguém acessar nada.
     */
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
