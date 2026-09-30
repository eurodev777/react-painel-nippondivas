import React, { useEffect, useState } from "react";

const API_URL =
  "https://sothink.com.br/centenario26/api/v2/nippon";

interface FormularioChavesProps {
  onClose: () => void;
}

interface ImagemChave {
  id: number;
  imagem: string;
  ordem: number;
}

export default function FormularioChaves({
  onClose,
}: FormularioChavesProps) {
  const [imagens, setImagens] = useState<ImagemChave[]>([]);
  const [arquivo, setArquivo] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const [editandoId, setEditandoId] = useState<number | null>(
    null
  );

  const [arrastandoId, setArrastandoId] =
    useState<number | null>(null);

  const [salvandoOrdem, setSalvandoOrdem] =
    useState(false);

  // =====================================================
  // URL DA IMAGEM
  // =====================================================

  const montarUrlImagem = (imagem: string) => {
    if (!imagem) {
      return "";
    }

    if (
      imagem.startsWith("http://") ||
      imagem.startsWith("https://")
    ) {
      return imagem;
    }

    return `https://sothink.com.br/centenario26/${imagem.replace(
      /^\/+/,
      ""
    )}`;
  };

  // =====================================================
  // LISTAR
  // =====================================================

  const carregarImagens = async () => {
    try {
      setCarregando(true);

      const res = await fetch(
        `${API_URL}/list-images`,
        {
          cache: "no-store",
        }
      );

      const texto = await res.text();

      console.log(
        "LIST-IMAGES:",
        texto
      );

      const data = JSON.parse(texto);

      // formato novo
      if (
        data.sucesso &&
        Array.isArray(data.dados)
      ) {
        setImagens(data.dados);
        return;
      }

      // compatibilidade caso sua rota retorne array direto
      if (Array.isArray(data)) {
        setImagens(data);
        return;
      }

      setImagens([]);
    } catch (error) {
      console.error(
        "Erro ao carregar:",
        error
      );

      setImagens([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarImagens();
  }, []);

  // =====================================================
  // ADICIONAR
  // =====================================================

  const handleUpload = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!arquivo) {
      alert("Selecione uma imagem!");
      return;
    }

    setLoading(true);

    const formData =
      new FormData();

    formData.append(
      "imagem",
      arquivo
    );

    try {
      const res = await fetch(
        `${API_URL}/images`,
        {
          method: "POST",
          body: formData,
        }
      );

      const texto =
        await res.text();

      console.log(
        "UPLOAD:",
        texto
      );

      const data =
        JSON.parse(texto);

      if (!data.sucesso) {
        alert(
          data.erro ||
            "Erro ao adicionar."
        );

        return;
      }

      setArquivo(null);

      const input =
        document.getElementById(
          "fileInputChaves"
        ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }

      await carregarImagens();
    } catch (error) {
      console.error(error);

      alert(
        "Erro ao enviar imagem."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // EDITAR / TROCAR FOTO
  // =====================================================

  const handleEditar = async (
    id: number,
    arquivoNovo: File | null
  ) => {
    if (!arquivoNovo) {
      return;
    }

    setEditandoId(id);

    const formData =
      new FormData();

    formData.append(
      "id",
      String(id)
    );

    formData.append(
      "imagem",
      arquivoNovo
    );

    try {
      const res = await fetch(
        `${API_URL}/edit-images`,
        {
          method: "POST",
          body: formData,
        }
      );

      const texto =
        await res.text();

      console.log(
        "EDITAR:",
        texto
      );

      const data =
        JSON.parse(texto);

      if (!data.sucesso) {
        alert(
          data.erro ||
            "Erro ao editar imagem."
        );

        return;
      }

      await carregarImagens();
    } catch (error) {
      console.error(error);

      alert(
        "Erro ao editar imagem."
      );
    } finally {
      setEditandoId(null);
    }
  };

  // =====================================================
  // DELETAR
  // =====================================================

  const handleDeletar = async (
    id: number
  ) => {
    if (
      !window.confirm(
        "Tem certeza que deseja deletar esta imagem?"
      )
    ) {
      return;
    }

    const formData =
      new FormData();

    formData.append(
      "id",
      String(id)
    );

    try {
      const res = await fetch(
        `${API_URL}/delete-images`,
        {
          method: "POST",
          body: formData,
        }
      );

      const texto =
        await res.text();

      console.log(
        "DELETE:",
        texto
      );

      const data =
        JSON.parse(texto);

      if (!data.sucesso) {
        alert(
          data.erro ||
            "Erro ao deletar."
        );

        return;
      }

      await carregarImagens();
    } catch (error) {
      console.error(error);

      alert(
        "Erro ao deletar imagem."
      );
    }
  };

  // =====================================================
  // SALVAR ORDEM NO BANCO
  // =====================================================

  const salvarOrdem = async (
    novaLista: ImagemChave[]
  ) => {
    try {
      setSalvandoOrdem(true);

      const ids =
        novaLista.map(
          (item) => item.id
        );

      const res = await fetch(
        `${API_URL}/reorder-images`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            ids,
          }),
        }
      );

      const texto =
        await res.text();

      console.log(
        "REORDER:",
        texto
      );

      const data =
        JSON.parse(texto);

      if (!data.sucesso) {
        throw new Error(
          data.erro ||
            "Erro ao salvar ordem."
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        "Não foi possível salvar a nova ordem."
      );

      // volta para o que está no banco
      await carregarImagens();
    } finally {
      setSalvandoOrdem(false);
    }
  };

  // =====================================================
  // DRAG START
  // =====================================================

  const handleDragStart = (
    id: number
  ) => {
    setArrastandoId(id);
  };

  // =====================================================
  // DROP
  // =====================================================

  const handleDrop = async (
    idDestino: number
  ) => {
    if (
      arrastandoId === null ||
      arrastandoId === idDestino
    ) {
      setArrastandoId(null);
      return;
    }

    const origemIndex =
      imagens.findIndex(
        (item) =>
          item.id === arrastandoId
      );

    const destinoIndex =
      imagens.findIndex(
        (item) =>
          item.id === idDestino
      );

    if (
      origemIndex === -1 ||
      destinoIndex === -1
    ) {
      setArrastandoId(null);
      return;
    }

    const novaLista =
      [...imagens];

    const [itemMovido] =
      novaLista.splice(
        origemIndex,
        1
      );

    novaLista.splice(
      destinoIndex,
      0,
      itemMovido
    );

    const listaNormalizada =
      novaLista.map(
        (item, index) => ({
          ...item,
          ordem:
            index + 1,
        })
      );

    // atualiza na tela imediatamente
    setImagens(
      listaNormalizada
    );

    setArrastandoId(null);

    // salva no banco
    await salvarOrdem(
      listaNormalizada
    );
  };

  // =====================================================
  // HTML
  // =====================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl p-6 relative max-h-[95vh] overflow-y-auto">

        {/* HEADER */}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Gerenciar Chaves
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Adicione, edite, exclua ou arraste as imagens para mudar a ordem.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* ADICIONAR */}

        <form
          onSubmit={handleUpload}
          className="flex flex-col sm:flex-row gap-4 mb-6 items-center border-b pb-6"
        >
          <input
            id="fileInputChaves"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={(e) =>
              setArquivo(
                e.target.files?.[0] ||
                  null
              )
            }
            className="
              block
              w-full
              text-sm
              text-gray-500

              file:mr-4
              file:py-2
              file:px-4
              file:rounded-md
              file:border-0
              file:text-sm
              file:font-semibold
              file:bg-blue-50
              file:text-blue-700

              hover:file:bg-blue-100
              cursor-pointer
            "
          />

          <button
            type="submit"
            disabled={loading}
            className="
              bg-blue-600
              hover:bg-blue-700
              text-white
              font-bold
              py-2
              px-6
              rounded-md
              disabled:opacity-50
              whitespace-nowrap
            "
          >
            {loading
              ? "Enviando..."
              : "Adicionar"}
          </button>
        </form>

        {/* INFORMAÇÃO DE ORDEM */}

        <div className="mb-5 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Arraste as imagens para reorganizar.
          </span>

          {salvandoOrdem && (
            <span className="text-xs font-semibold text-blue-600">
              Salvando ordem...
            </span>
          )}
        </div>

        {/* CARREGANDO */}

        {carregando && (
          <div className="py-10 text-center text-gray-500">
            Carregando imagens...
          </div>
        )}

        {/* GALERIA */}

        {!carregando && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {imagens.map(
              (item, index) => (
                <div
                  key={item.id}
                  draggable={
                    editandoId ===
                    null
                  }
                  onDragStart={() =>
                    handleDragStart(
                      item.id
                    )
                  }
                  onDragOver={(
                    e
                  ) => {
                    e.preventDefault();
                  }}
                  onDrop={() =>
                    handleDrop(
                      item.id
                    )
                  }
                  onDragEnd={() =>
                    setArrastandoId(
                      null
                    )
                  }
                  className={`
                    relative
                    group
                    rounded-lg
                    overflow-hidden
                    border
                    shadow-sm
                    aspect-[9/16]
                    bg-gray-100
                    cursor-move
                    transition

                    ${
                      arrastandoId ===
                      item.id
                        ? "opacity-40 scale-95"
                        : ""
                    }
                  `}
                >
                  {/* FOTO */}

                  <img
                    src={montarUrlImagem(
                      item.imagem
                    )}
                    alt={`Chave ${item.id}`}
                    draggable={false}
                    className="w-full h-full object-cover pointer-events-none"
                  />

                  {/* POSIÇÃO */}

                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-md">
                    #{index + 1}
                  </div>

                  {/* INDICAÇÃO ARRASTAR */}

                  <div className="absolute top-2 right-2 bg-white/90 text-gray-700 text-xs px-2 py-1 rounded-md shadow">
                    ↕ Arrastar
                  </div>

                  {/* OVERLAY */}

                  <div
                    className="
                      absolute
                      inset-0
                      bg-black/50

                      opacity-0
                      group-hover:opacity-100

                      transition-opacity

                      flex
                      flex-col
                      items-center
                      justify-center
                      gap-2
                    "
                  >

                    {/* EDITAR */}

                    <label
                      className="
                        bg-blue-600
                        hover:bg-blue-700
                        text-white
                        font-bold
                        text-sm
                        py-2
                        px-5
                        rounded
                        cursor-pointer
                        min-w-[110px]
                        text-center
                      "
                      onMouseDown={(
                        e
                      ) => {
                        e.stopPropagation();
                      }}
                    >
                      {editandoId ===
                      item.id
                        ? "Enviando..."
                        : "Editar foto"}

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        disabled={
                          editandoId ===
                          item.id
                        }
                        onChange={(
                          e
                        ) => {
                          const file =
                            e.target
                              .files?.[0] ||
                            null;

                          handleEditar(
                            item.id,
                            file
                          );

                          e.currentTarget.value =
                            "";
                        }}
                      />
                    </label>

                    {/* DELETE */}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();

                        handleDeletar(
                          item.id
                        );
                      }}
                      className="
                        bg-red-500
                        hover:bg-red-600
                        text-white
                        font-bold
                        text-sm
                        py-2
                        px-5
                        rounded
                        min-w-[110px]
                      "
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              )
            )}

            {imagens.length ===
              0 && (
              <p className="text-gray-500 col-span-2 md:col-span-4">
                Nenhuma imagem nas chaves ainda.
              </p>
            )}
          </div>
        )}

        {/* FOOTER */}

        <div className="mt-8 pt-4 border-t border-stone-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="
              bg-stone-950
              hover:bg-stone-900
              text-white
              px-6
              py-2.5
              rounded-xl
              text-xs
              font-bold
              transition
              cursor-pointer
            "
          >
            Concluir e Fechar
          </button>
        </div>
      </div>
    </div>
  );
}