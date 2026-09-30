import React, { useEffect, useRef, useState } from "react";

const API_URL = "https://sothink.com.br/centenario26/api/v2/nipponimages";
const BASE_URL = "https://sothink.com.br/centenario26/";

interface ImagemGaleria {
  id: number;
  imagem: string;
  descricao?: string | null;
}

interface GalleryAdminProps {
  onClose: () => void;
}

type ToastTipo = "sucesso" | "erro" | "info";

type ToastState = {
  aberto: boolean;
  tipo: ToastTipo;
  titulo: string;
  texto: string;
};

const toastInicial: ToastState = {
  aberto: false,
  tipo: "info",
  titulo: "",
  texto: "",
};

function mostrarTamanho(bytes: number) {
  if (!bytes) return "0 KB";

  const mb = bytes / 1024 / 1024;

  if (mb >= 1) {
    return `${mb.toFixed(1).replace(".", ",")} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function criarImagem(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível carregar a imagem para otimizar."));

    img.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Não foi possível otimizar a imagem."));
          return;
        }

        resolve(blob);
      },
      type,
      quality,
    );
  });
}

/*
 * Compacta no navegador antes de enviar.
 * Isso deixa o upload mais rápido porque o arquivo já sai menor do painel.
 * Qualidade 0.6 = reduz cerca de 40% da qualidade.
 */
async function otimizarImagem(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem válido.");
  }

  // SVG/GIF animado e formatos que o canvas pode não tratar bem:
  // envia original para não quebrar.
  if (file.type.includes("svg") || file.type.includes("gif")) {
    return file;
  }

  const url = URL.createObjectURL(file);

  try {
    const img = await criarImagem(url);

    const maxLado = 1800;
    const maiorLado = Math.max(img.width, img.height);
    const escala = maiorLado > maxLado ? maxLado / maiorLado : 1;

    const largura = Math.max(1, Math.round(img.width * escala));
    const altura = Math.max(1, Math.round(img.height * escala));

    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return file;
    }

    ctx.drawImage(img, 0, 0, largura, altura);

    const blob = await canvasToBlob(canvas, "image/webp", 0.6);

    // Se por algum motivo a conversão ficar maior, manda o original.
    if (blob.size >= file.size) {
      return file;
    }

    const nomeBase = file.name.replace(/\.[^.]+$/, "");

    return new File([blob], `${nomeBase}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function enviarFormData(
  url: string,
  formData: FormData,
  onProgress?: (percentual: number) => void,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.timeout = 0;
    xhr.open("POST", url, true);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;

      const percentual = Math.round((event.loaded / event.total) * 100);
      onProgress(percentual);
    };

    xhr.onload = () => {
      const texto = xhr.responseText || "";

      let data: any = null;

      try {
        data = texto ? JSON.parse(texto) : {};
      } catch {
        reject(
          new Error(
            `A API não retornou JSON. Status ${xhr.status}. Resposta: ${texto.slice(0, 400)}`,
          ),
        );
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
        return;
      }

      reject(new Error(data?.erro || `Erro HTTP ${xhr.status}`));
    };

    xhr.onerror = () => {
      reject(new Error("Erro de conexão com a API."));
    };

    xhr.onabort = () => {
      reject(new Error("Envio cancelado."));
    };

    xhr.send(formData);
  });
}

async function buscarJson(url: string) {
  const res = await fetch(url);
  const texto = await res.text();

  let data: any = null;

  try {
    data = texto ? JSON.parse(texto) : {};
  } catch {
    throw new Error(
      `A API não retornou JSON. Status ${res.status}. Resposta: ${texto.slice(0, 400)}`,
    );
  }

  if (!res.ok) {
    throw new Error(data?.erro || `Erro HTTP ${res.status}`);
  }

  return data;
}

export default function GalleryAdmin({ onClose }: GalleryAdminProps) {
  const [imagens, setImagens] = useState<ImagemGaleria[]>([]);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [statusUpload, setStatusUpload] = useState("");
  const [toast, setToast] = useState<ToastState>(toastInicial);

  const [editando, setEditando] = useState<ImagemGaleria | null>(null);
  const [descricaoEdit, setDescricaoEdit] = useState("");
  const [arquivoEdit, setArquivoEdit] = useState<File | null>(null);
  const [salvandoEdit, setSalvandoEdit] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputEditRef = useRef<HTMLInputElement | null>(null);

  const abrirToast = (tipo: ToastTipo, titulo: string, texto: string) => {
    setToast({
      aberto: true,
      tipo,
      titulo,
      texto,
    });

    window.setTimeout(() => {
      setToast((atual) => ({ ...atual, aberto: false }));
    }, 4500);
  };

  const carregarImagens = async () => {
    try {
      const data = await buscarJson(`${API_URL}/listar`);

      if (data.sucesso) {
        setImagens(data.dados || []);
      } else {
        abrirToast("erro", "Erro ao carregar", data.erro || "Não foi possível carregar a galeria.");
      }
    } catch (error) {
      console.error(error);
      abrirToast(
        "erro",
        "Erro ao carregar",
        error instanceof Error ? error.message : "Não foi possível carregar a galeria.",
      );
    }
  };

  useEffect(() => {
    carregarImagens();
  }, []);

  const limparCadastro = () => {
    setArquivo(null);
    setDescricao("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const abrirEdicao = (item: ImagemGaleria) => {
    setEditando(item);
    setDescricaoEdit(item.descricao || "");
    setArquivoEdit(null);

    if (fileInputEditRef.current) {
      fileInputEditRef.current.value = "";
    }
  };

  const fecharEdicao = () => {
    setEditando(null);
    setDescricaoEdit("");
    setArquivoEdit(null);

    if (fileInputEditRef.current) {
      fileInputEditRef.current.value = "";
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!arquivo) {
      abrirToast("erro", "Selecione uma imagem", "Escolha uma foto antes de cadastrar.");
      return;
    }

    setLoading(true);
    setProgresso(0);
    setStatusUpload("Otimizando imagem...");

    try {
      const arquivoOtimizado = await otimizarImagem(arquivo);

      setStatusUpload(
        `Salvando foto... ${mostrarTamanho(arquivo.size)} → ${mostrarTamanho(arquivoOtimizado.size)}`,
      );

      const formData = new FormData();
      formData.append("tabela", "galeria");
      formData.append("imagem", arquivoOtimizado);
      formData.append("descricao", descricao.trim());

      const data = await enviarFormData(`${API_URL}/inserir`, formData, setProgresso);

      if (data.sucesso) {
        setStatusUpload("Atualizando galeria...");
        limparCadastro();
        await carregarImagens();

        abrirToast(
          "sucesso",
          "Foto cadastrada",
          "Imagem otimizada e salva na galeria com sucesso.",
        );
      } else {
        abrirToast("erro", "Erro ao salvar", data.erro || "Não foi possível cadastrar a imagem.");
      }
    } catch (error) {
      console.error(error);

      abrirToast(
        "erro",
        "Erro no envio",
        error instanceof Error ? error.message : "Não foi possível enviar a imagem.",
      );
    } finally {
      setLoading(false);
      setProgresso(0);
      setStatusUpload("");
    }
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editando) return;

    setSalvandoEdit(true);
    setStatusUpload(arquivoEdit ? "Otimizando nova imagem..." : "Salvando descrição...");

    try {
      const formData = new FormData();
      formData.append("tabela", "galeria");
      formData.append("id", String(editando.id));
      formData.append("descricao", descricaoEdit.trim());

      if (arquivoEdit) {
        const arquivoOtimizado = await otimizarImagem(arquivoEdit);
        formData.append("imagem", arquivoOtimizado);
      }

      const data = await enviarFormData(`${API_URL}/editar`, formData, setProgresso);

      if (data.sucesso) {
        fecharEdicao();
        await carregarImagens();

        abrirToast(
          "sucesso",
          "Foto atualizada",
          "As alterações foram salvas com sucesso.",
        );
      } else {
        abrirToast("erro", "Erro ao editar", data.erro || "Não foi possível editar a imagem.");
      }
    } catch (error) {
      console.error(error);

      abrirToast(
        "erro",
        "Erro ao editar",
        error instanceof Error ? error.message : "Não foi possível editar a imagem.",
      );
    } finally {
      setSalvandoEdit(false);
      setProgresso(0);
      setStatusUpload("");
    }
  };

  const handleDeletar = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja deletar esta imagem?")) return;

    const formData = new FormData();
    formData.append("tabela", "galeria");
    formData.append("id", id.toString());

    try {
      const data = await enviarFormData(`${API_URL}/deletar`, formData);

      if (data.sucesso) {
        await carregarImagens();
        abrirToast("sucesso", "Foto deletada", "Imagem removida da galeria.");
      } else {
        abrirToast("erro", "Erro ao deletar", data.erro || "Não foi possível deletar a imagem.");
      }
    } catch (error) {
      console.error(error);

      abrirToast(
        "erro",
        "Erro ao deletar",
        error instanceof Error ? error.message : "Não foi possível deletar a imagem.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Gerenciar Galeria
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              As fotos são otimizadas automaticamente antes de salvar.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200"
          >
            Fechar
          </button>
        </div>

        <form
          onSubmit={handleUpload}
          className="mb-8 grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 md:grid-cols-[1fr_1.4fr_auto]"
        >
          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-gray-500">
              Imagem
            </label>

            <input
              ref={fileInputRef}
              id="fileInput"
              type="file"
              accept="image/*"
              onChange={(e) =>
                setArquivo(e.target.files ? e.target.files[0] : null)
              }
              className="block w-full cursor-pointer rounded-lg bg-white text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
            />

            {arquivo ? (
              <p className="mt-2 text-xs font-semibold text-gray-500">
                Selecionado: {arquivo.name} · {mostrarTamanho(arquivo.size)}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-gray-500">
              Descrição opcional
            </label>

            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Digite uma descrição ou deixe vazio..."
              rows={2}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-6 py-2.5 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
              {loading ? "Salvando..." : "Cadastrar"}
            </button>
          </div>
        </form>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {imagens.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-lg border bg-white shadow-sm"
            >
              <div className="aspect-[9/16] bg-gray-100">
                <img
                  src={`${BASE_URL}${item.imagem}`}
                  alt={item.descricao || "Galeria Admin"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="border-t p-3">
                <p className="min-h-[40px] text-xs leading-snug text-gray-700">
                  {item.descricao?.trim() || (
                    <span className="text-gray-400">Sem descrição</span>
                  )}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => abrirEdicao(item)}
                    className="rounded bg-stone-900 px-3 py-2 text-xs font-bold text-white hover:bg-stone-800"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeletar(item.id)}
                    className="rounded bg-red-500 px-3 py-2 text-xs font-bold text-white hover:bg-red-600"
                  >
                    Deletar
                  </button>
                </div>
              </div>
            </div>
          ))}

          {imagens.length === 0 && (
            <p className="col-span-full rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-500">
              Nenhuma imagem na galeria ainda.
            </p>
          )}
        </div>

        <div className="mt-8 flex justify-end border-t border-stone-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl bg-stone-950 px-6 py-2.5 text-xs font-bold text-white transition hover:bg-stone-900"
          >
            Concluir e Fechar
          </button>
        </div>
      </div>

      {(loading || salvandoEdit) && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

            <h3 className="text-lg font-bold text-gray-900">
              Salvando foto
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {statusUpload || "Aguarde enquanto a imagem é enviada..."}
            </p>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${Math.max(8, progresso)}%` }}
              />
            </div>

            <p className="mt-2 text-xs font-bold text-gray-400">
              {progresso > 0 ? `${progresso}%` : "Preparando..."}
            </p>
          </div>
        </div>
      )}

      {toast.aberto && (
        <div className="fixed right-4 top-4 z-[90] w-[calc(100%-32px)] max-w-sm">
          <div
            className={`rounded-2xl border p-4 shadow-2xl ${
              toast.tipo === "sucesso"
                ? "border-green-200 bg-green-50 text-green-900"
                : toast.tipo === "erro"
                  ? "border-red-200 bg-red-50 text-red-900"
                  : "border-blue-200 bg-blue-50 text-blue-900"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm">
                {toast.tipo === "sucesso" ? "✓" : toast.tipo === "erro" ? "!" : "i"}
              </span>

              <div className="min-w-0">
                <strong className="block text-sm font-black">
                  {toast.titulo}
                </strong>

                <p className="mt-1 text-sm leading-snug">
                  {toast.texto}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setToast((atual) => ({ ...atual, aberto: false }))}
                className="ml-auto text-lg font-black opacity-60 hover:opacity-100"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {editando && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={handleEditar}
            className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl"
          >
            <h3 className="mb-4 text-lg font-bold text-gray-800">
              Editar imagem
            </h3>

            <div className="mb-4 overflow-hidden rounded-lg border bg-gray-100">
              <img
                src={`${BASE_URL}${editando.imagem}`}
                alt={editando.descricao || "Imagem da galeria"}
                className="max-h-[280px] w-full object-contain"
              />
            </div>

            <label className="mb-2 block text-xs font-bold uppercase text-gray-500">
              Trocar imagem opcional
            </label>

            <input
              ref={fileInputEditRef}
              id="fileInputEdit"
              type="file"
              accept="image/*"
              onChange={(e) =>
                setArquivoEdit(e.target.files ? e.target.files[0] : null)
              }
              className="mb-4 block w-full cursor-pointer text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
            />

            <label className="mb-2 block text-xs font-bold uppercase text-gray-500">
              Descrição opcional
            </label>

            <textarea
              value={descricaoEdit}
              onChange={(e) => setDescricaoEdit(e.target.value)}
              placeholder="Digite uma descrição ou deixe vazio..."
              rows={4}
              className="mb-5 w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={fecharEdicao}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={salvandoEdit}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {salvandoEdit ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
