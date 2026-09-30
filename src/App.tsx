import React, { useState, useEffect, useCallback } from "react";
import { Categoria, Equipe, Atleta } from "./types";
import { DEFAULT_CATEGORIES } from "./data/defaultData";
import Header from "./components/Header";
import CategoryTabs from "./components/CategoryTabs";
import TeamCard from "./components/TeamCard";
import OfflineBanner from "./components/OfflineBanner";
import { motion, AnimatePresence } from "motion/react";
import {
  Loader2,
  CheckCircle2,
  ShieldAlert,
  Plus,
  Users,
  Search,
  AlertCircle,
  X,
  ShieldCheck,
  FileImage,
  Image,
} from "lucide-react";
import FormularioChaves from "./components/FormularioChaves";
import GalleryAdmin from "./components/GalleryAdmin";

const API_URL = "https://sothink.com.br/centenario26/api/v2/nippon";

export default function App() {
  // State
  const [isAdminView, setIsAdminView] = useState(false);
  const [dados, setDados] = useState<{ categorias: Categoria[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoriaAtual, setCategoriaAtual] = useState(0);
  const [savingStatus, setSavingStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [erroLogin, setErroLogin] = useState("");
  // Adicione este state junto com os seus outros hooks useState (ex: abaixo de erroLogin)
  const [isChavesOpen, setIsChavesOpen] = useState(false);
  const [isGaleriaOpen, setIsGaleriaOpen] = useState(false);

  const autenticar = () => {
    const usuariosPermitidos = ["Regis Nippon", "Junior Nippon"];

    const senhaPadrao = "Nippon2026!";

    const usuarioValido = usuariosPermitidos.some(
      (u) => u.toLowerCase() === login.trim().toLowerCase(),
    );

    if (usuarioValido && senha === senhaPadrao) {
      setErroLogin("");
      setIsAdminView(true);
      return;
    }

    setErroLogin("Usuário ou senha inválidos.");
  };

  const removerEquipe = async (eqIdx: number) => {
    if (!dados) return;

    const equipe = dados.categorias[categoriaAtual].equipes[eqIdx];

    const response = await fetch(
      `${API_URL}/deletar?tabela=equipes&id=${obterId(equipe)}`,
    );

    console.log(await response.text());

    carregarDados();
  };

  const removerAtleta = async (eqIdx: number, atlIdx: number) => {
    if (!dados) return;

    const atleta =
      dados.categorias[categoriaAtual].equipes[eqIdx].atletas[atlIdx];

    const response = await fetch(
      `${API_URL}/deletar?tabela=atletas&id=${obterId(atleta)}`,
    );

    console.log(await response.text());

    carregarDados();
  };

  const removerCategoria = async (idx: number) => {
    if (!dados) return;

    const categoria = dados.categorias[idx];

    const response = await fetch(
      `${API_URL}/deletar?tabela=categorias&id=${obterId(categoria)}`,
    );

    console.log(await response.text());

    carregarDados();
  };

  // UNIVERSAL ID EXTRACTOR (keeps compatibility with diverse database schemas)
  const obterId = (obj: any): string | number | undefined => {
    if (!obj || typeof obj !== "object") return undefined;

    const chavesComuns = [
      "id",
      "categoria_id",
      "id_categoria",
      "equipe_id",
      "id_equipe",
      "atleta_id",
      "id_atleta",
      "idCategoria",
      "idEquipe",
      "idAtleta",
    ];

    for (const chave of chavesComuns) {
      if (
        obj[chave] !== undefined &&
        obj[chave] !== null &&
        String(obj[chave]) !== "undefined"
      ) {
        return obj[chave];
      }
    }

    const chaveAlternativa = Object.keys(obj).find(
      (k) =>
        k.toLowerCase().includes("id") &&
        obj[k] !== undefined &&
        obj[k] !== null &&
        String(obj[k]) !== "undefined",
    );

    if (chaveAlternativa) return obj[chaveAlternativa];
    return undefined;
  };

  // LOAD DATA FROM API OR LOCAL STORAGE FALLBACK
  const carregarDados = async (retry = false) => {
    if (retry) {
      setIsRetrying(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);

    try {
      const response = await fetch(
        "https://sothink.com.br/centenario26/api/v2/nippon/listar?tabela=completo",
      );
      if (!response.ok) {
        throw new Error(`Servidor respondeu com status: ${response.status}`);
      }

      const json = await response.json();

      if (json && json.categorias && Array.isArray(json.categorias)) {
        setDados(json);
        setIsOfflineMode(false);
        // Sync API data with LocalStorage for backup
        localStorage.setItem("nippon_atletas_data", JSON.stringify(json));
      } else {
        throw new Error("Formato de dados recebido é inválido.");
      }
    } catch (error: any) {
      console.warn(
        "API falhou ou bloqueio de CORS. Usando fallback offline do LocalStorage.",
      );

      // Fallback state initialization
      const localBackup = localStorage.getItem("nippon_atletas_data");
      if (localBackup) {
        try {
          setDados(JSON.parse(localBackup));
        } catch {
          setDados({ categorias: DEFAULT_CATEGORIES });
        }
      } else {
        setDados({ categorias: DEFAULT_CATEGORIES });
        localStorage.setItem(
          "nippon_atletas_data",
          JSON.stringify({ categorias: DEFAULT_CATEGORIES }),
        );
      }
      setIsOfflineMode(true);
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // FORCE RESET TO SEEDED PORTUGUESE SPORTS DATA
  const resetParaDadosPadrao = () => {
    if (
      window.confirm(
        "Tem certeza que deseja redefinir todas as tabelas para os dados esportivos padrões? Suas alterações locais serão perdidas.",
      )
    ) {
      setDados({ categorias: DEFAULT_CATEGORIES });
      localStorage.setItem(
        "nippon_atletas_data",
        JSON.stringify({ categorias: DEFAULT_CATEGORIES }),
      );
      setCategoriaAtual(0);
      setIsOfflineMode(true);
      showToastNotification();
    }
  };

  const showToastNotification = () => {
    setSavingStatus("saved");
    setTimeout(() => setSavingStatus("idle"), 2000);
  };

  // SAVE OR UPDATE API OR LOCAL STORAGE SENDER
  const salvarAlteracaoNoServidor = async (
    tipo: "categoria" | "equipe" | "atleta",
    id: any,
    novoValor: string,
    parentId?: number | string,
    eqIdx?: number,
    atlIdx?: number,
  ) => {
    if (!novoValor.trim() || !dados) return;

    const ehNovoRegistro =
      !id ||
      String(id).startsWith("novo-") ||
      String(id).startsWith("atl-temp-");

    // DEFENSIVE INSPECTION: Warn if saving child without a valid parent key
    if (ehNovoRegistro && (tipo === "equipe" || tipo === "atleta")) {
      if (
        !parentId ||
        String(parentId) === "undefined" ||
        String(parentId) === "null" ||
        String(parentId).startsWith("novo-")
      ) {
        console.error(
          `[BLOQUEIO] Objeto pai da ${tipo} não possui um ID válido no banco de dados ainda.`,
          parentId,
        );
        alert(
          `[Erro de Vínculo] Não é possível salvar este(a) ${tipo} ainda.\n\n` +
            `Aguarde o salvamento completo do elemento pai, ou certifique-se de preencher o nome do pai primeiro.`,
        );
        return;
      }
    }

    setSavingStatus("saving");
    setErrorMessage(null);

    // 1. OFFLINE MODE / LOCALSTORAGE PERSISTENCE
    if (isOfflineMode) {
      setTimeout(() => {
        const novosDados = { ...dados };

        if (ehNovoRegistro) {
          const fakeDatabaseId = Math.floor(Math.random() * 100000) + 1000;

          if (tipo === "equipe" && eqIdx !== undefined) {
            const eq = novosDados.categorias[categoriaAtual].equipes[eqIdx];
            eq.id = fakeDatabaseId;
            eq.equipe_id = fakeDatabaseId;
            eq.id_equipe = fakeDatabaseId;
            eq.nome = novoValor;
          } else if (
            tipo === "atleta" &&
            eqIdx !== undefined &&
            atlIdx !== undefined
          ) {
            const atl =
              novosDados.categorias[categoriaAtual].equipes[eqIdx].atletas[
                atlIdx
              ];
            if (typeof atl === "object" && atl !== null) {
              atl.id = fakeDatabaseId;
              atl.atleta_id = fakeDatabaseId;
              atl.id_atleta = fakeDatabaseId;
              atl.nome = novoValor;
            }
          }
        } else {
          // Edit existing local record
          if (tipo === "categoria") {
            const cat = novosDados.categorias[categoriaAtual];
            if (cat) cat.titulo = novoValor;
          } else if (tipo === "equipe" && eqIdx !== undefined) {
            const eq = novosDados.categorias[categoriaAtual].equipes[eqIdx];
            if (eq) eq.nome = novoValor;
          } else if (
            tipo === "atleta" &&
            eqIdx !== undefined &&
            atlIdx !== undefined
          ) {
            const atl =
              novosDados.categorias[categoriaAtual].equipes[eqIdx].atletas[
                atlIdx
              ];
            if (typeof atl === "object" && atl !== null) {
              atl.nome = novoValor;
            } else {
              novosDados.categorias[categoriaAtual].equipes[eqIdx].atletas[
                atlIdx
              ] = {
                id: id,
                nome: novoValor,
              };
            }
          }
        }

        setDados(novosDados);
        localStorage.setItem("nippon_atletas_data", JSON.stringify(novosDados));
        setSavingStatus("saved");
        setTimeout(() => setSavingStatus("idle"), 2000);
      }, 400);

      return;
    }

    // 2. ONLINE MODE (DIRECT REMOTE API ACTIONS)
    try {
      let response;

      if (ehNovoRegistro) {
        const formData = new FormData();
        if (tipo === "equipe") {
          formData.append("tabela", "equipes");
          formData.append("categoria_id", String(parentId));
          formData.append("nome", novoValor);
        } else if (tipo === "atleta") {
          formData.append("tabela", "atletas");
          formData.append("equipe_id", String(parentId));
          formData.append("nome", novoValor);
        }

        response = await fetch(
          "https://sothink.com.br/centenario26/api/v2/nippon/inserir",
          {
            method: "POST",
            body: formData,
          },
        );
      } else {
        response = await fetch(
          "https://sothink.com.br/centenario26/api/v2/nippon/editar",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tipo, id, valor: novoValor }),
          },
        );
      }

      const textoResposta = await response.text();
      console.log("[Resposta Servidor API]:", textoResposta);

      if (!response.ok) {
        throw new Error(
          `Servidor retornou erro status ${response.status}. Detalhes: ${textoResposta}`,
        );
      }

      if (!textoResposta.trim()) {
        throw new Error("Servidor retornou resposta em branco.");
      }

      let resJson;
      try {
        resJson = JSON.parse(textoResposta);
      } catch (e) {
        throw new Error(`Erro de JSON na resposta:\n${textoResposta}`);
      }

      if (resJson.erro) {
        throw new Error(resJson.erro);
      }

      // If insert was successful, map the real database ID in our React state
      if (ehNovoRegistro && resJson.sucesso && resJson.id_inserido) {
        const novosDados = { ...dados };
        if (tipo === "equipe" && eqIdx !== undefined) {
          const eq = novosDados.categorias[categoriaAtual].equipes[eqIdx];
          eq.id = resJson.id_inserido;
          eq.equipe_id = resJson.id_inserido;
          eq.id_equipe = resJson.id_inserido;
          eq.nome = novoValor;
        } else if (
          tipo === "atleta" &&
          eqIdx !== undefined &&
          atlIdx !== undefined
        ) {
          const atl =
            novosDados.categorias[categoriaAtual].equipes[eqIdx].atletas[
              atlIdx
            ];
          if (typeof atl === "object" && atl !== null) {
            atl.id = resJson.id_inserido;
            atl.atleta_id = resJson.id_inserido;
            atl.id_atleta = resJson.id_inserido;
            atl.nome = novoValor;
          }
        }
        setDados(novosDados);
        localStorage.setItem("nippon_atletas_data", JSON.stringify(novosDados));
      }

      setSavingStatus("saved");
      setTimeout(() => setSavingStatus("idle"), 2000);
    } catch (error: any) {
      console.error("Erro de gravação na API:", error);
      setErrorMessage(error.message || "Falha de comunicação com o servidor.");
      setSavingStatus("error");

      // Fallback temporarily inside current session state
      alert(
        `[Servidor de Banco] Não foi possível salvar: ${error.message}.\nO item foi mantido temporariamente no seu navegador.`,
      );
    }
  };

  // LOCAL STATE MODIFICATIONS
  const adicionarCategoriaLocal = async (titulo: string) => {
    if (!dados) return;

    setSavingStatus("saving");
    const novoTituloCompleto = titulo.startsWith("RELAÇÃO DOS ATLETAS - ")
      ? titulo
      : `RELAÇÃO DOS ATLETAS - ${titulo.toUpperCase()}`;

    // Prepare Category object
    const novaCategoriaObj: Categoria = {
      id: `novo-cat-${Date.now()}`,
      titulo: novoTituloCompleto,
      equipes: [],
    };

    const novosDados = { ...dados };
    novosDados.categorias.push(novaCategoriaObj);
    setDados(novosDados);

    // Auto shift to newly added category tab
    const novoIndex = novosDados.categorias.length - 1;
    setCategoriaAtual(novoIndex);

    // Online insertion payload
    if (!isOfflineMode) {
      try {
        const formData = new FormData();
        formData.append("tabela", "categorias");
        formData.append("titulo", novoTituloCompleto);

        const response = await fetch(
          "https://sothink.com.br/centenario26/api/v2/nippon/inserir",
          {
            method: "POST",
            body: formData,
          },
        );

        const resText = await response.text();
        const resJson = JSON.parse(resText);

        if (resJson.sucesso && resJson.id_inserido) {
          const dadosComId = { ...novosDados };
          dadosComId.categorias[novoIndex].id = resJson.id_inserido;
          dadosComId.categorias[novoIndex].categoria_id = resJson.id_inserido;
          dadosComId.categorias[novoIndex].id_categoria = resJson.id_inserido;
          setDados(dadosComId);
          localStorage.setItem(
            "nippon_atletas_data",
            JSON.stringify(dadosComId),
          );
        }
        setSavingStatus("saved");
        setTimeout(() => setSavingStatus("idle"), 2000);
      } catch (err) {
        console.warn(
          "Erro ao inserir categoria remotamente. Mantido localmente.",
          err,
        );
        setSavingStatus("idle");
      }
    } else {
      localStorage.setItem("nippon_atletas_data", JSON.stringify(novosDados));
      setSavingStatus("saved");
      setTimeout(() => setSavingStatus("idle"), 2000);
    }
  };

  const adicionarEquipeLocal = () => {
    if (!dados) return;
    const novosDados = { ...dados };
    const novaEquipe: Equipe = {
      id: `novo-equipe-${Date.now()}`,
      nome: "",
      atletas: [],
    };
    novosDados.categorias[categoriaAtual].equipes.push(novaEquipe);
    setDados(novosDados);
  };

  const adicionarAtletaLocal = (equipeIndex: number) => {
    if (!dados) return;
    const novosDados = { ...dados };
    const novoAtleta: Atleta = {
      id: `novo-atleta-${Date.now()}`,
      nome: "",
    };

    if (!novosDados.categorias[categoriaAtual].equipes[equipeIndex].atletas) {
      novosDados.categorias[categoriaAtual].equipes[equipeIndex].atletas = [];
    }

    novosDados.categorias[categoriaAtual].equipes[equipeIndex].atletas.push(
      novoAtleta,
    );
    setDados(novosDados);
  };

  const handleCategoriaChange = (novoTitulo: string) => {
    if (!dados) return;
    const novosDados = { ...dados };
    novosDados.categorias[categoriaAtual].titulo = novoTitulo;
    setDados(novosDados);
  };

  const handleEquipeChange = (equipeIndex: number, novoNome: string) => {
    if (!dados) return;
    const novosDados = { ...dados };
    novosDados.categorias[categoriaAtual].equipes[equipeIndex].nome = novoNome;
    setDados(novosDados);
  };

  const handleAtletaChange = (
    equipeIndex: number,
    atletaIndex: number,
    novoNome: string,
  ) => {
    if (!dados) return;
    const novosDados = { ...dados };
    const atletaAlvo =
      novosDados.categorias[categoriaAtual].equipes[equipeIndex].atletas[
        atletaIndex
      ];

    if (typeof atletaAlvo === "object" && atletaAlvo !== null) {
      novosDados.categorias[categoriaAtual].equipes[equipeIndex].atletas[
        atletaIndex
      ].nome = novoNome;
    } else {
      novosDados.categorias[categoriaAtual].equipes[equipeIndex].atletas[
        atletaIndex
      ] = {
        id: `novo-atleta-${Date.now()}`,
        nome: novoNome,
      };
    }
    setDados(novosDados);
  };

  // SEARCH LOGIC - Finds any athlete or team across any category
  const getFilteredSearchResults = () => {
    if (!dados || !searchTerm.trim()) return [];

    const query = searchTerm.toLowerCase().trim();
    const results: {
      categoryTitle: string;
      teamName: string;
      athleteName?: string;
      type: "team" | "athlete";
    }[] = [];

    dados.categorias.forEach((cat) => {
      cat.equipes?.forEach((eq) => {
        // Check if team name matches
        if (eq.nome && eq.nome.toLowerCase().includes(query)) {
          results.push({
            categoryTitle: cat.titulo,
            teamName: eq.nome,
            type: "team",
          });
        }

        // Check if athlete names match
        eq.atletas?.forEach((atl) => {
          const name = typeof atl === "object" ? atl.nome : String(atl);
          if (name && name.toLowerCase().includes(query)) {
            results.push({
              categoryTitle: cat.titulo,
              teamName: eq.nome,
              athleteName: name,
              type: "athlete",
            });
          }
        });
      });
    });

    return results;
  };

  // CORE STATS COUNT FOR THE HEADER
  const getStats = () => {
    if (!dados) return { cats: 0, eqs: 0, atls: 0 };
    let totalEquipesCount = 0;
    let totalAtletasCount = 0;

    dados.categorias.forEach((cat) => {
      totalEquipesCount += cat.equipes?.length || 0;
      cat.equipes?.forEach((eq) => {
        totalAtletasCount += eq.atletas?.length || 0;
      });
    });

    return {
      cats: dados.categorias.length,
      eqs: totalEquipesCount,
      atls: totalAtletasCount,
    };
  };

  if (loading) {
    return (
      <div className="bg-stone-50 min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full mb-4"
        />
        <h3 className="text-stone-800 font-bold text-lg font-display">
          NIPPON SOROCABA
        </h3>
        <p className="text-stone-400 text-sm mt-1">
          Carregando painel de gerenciamento oficial de atletas...
        </p>
      </div>
    );
  }

  const activeCategoryObj = dados?.categorias?.[categoriaAtual];
  const { cats: totalCats, eqs: totalEqs, atls: totalAtls } = getStats();
  const searchResults = getFilteredSearchResults();

  return (
    <div className="bg-stone-50 min-h-screen flex flex-col text-stone-800 font-sans selection:bg-red-200">
      {/* Intro Landing View vs. Active Dashboard View */}
      {!isAdminView ? (
        <div className="flex-1 flex items-center justify-center bg-stone-100 px-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-200 p-8">
            <h1 className="text-3xl font-black text-center text-red-600">
              Nippon Sorocaba
            </h1>

            <p className="text-center text-stone-500 mt-2 mb-8">
              Painel Administrativo
            </p>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold">Usuário</label>

                <input
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="mt-2 w-full border rounded-xl px-4 py-3 outline-none focus:border-red-600"
                  placeholder="Digite seu usuário"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Senha</label>

                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") autenticar();
                  }}
                  className="mt-2 w-full border rounded-xl px-4 py-3 outline-none focus:border-red-600"
                  placeholder="Digite sua senha"
                />
              </div>

              {erroLogin && (
                <div className="text-red-600 text-sm font-medium">
                  {erroLogin}
                </div>
              )}

              <button
                onClick={autenticar}
                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 font-bold transition"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* OFFLINE MODERATOR WARNING BANNER */}
          <OfflineBanner
            isOfflineMode={isOfflineMode}
            onResetToDefault={resetParaDadosPadrao}
            onRetryConnection={() => carregarDados(true)}
            isRetrying={isRetrying}
          />

          {/* DASHBOARD HEADER */}
          <Header
            totalCategorias={totalCats}
            totalEquipes={totalEqs}
            totalAtletas={totalAtls}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />

          {/* ACTION / NOTIFICATION TOAST IN CORNER */}
          <div className="fixed bottom-6 right-6 bg-white/95 backdrop-blur-md shadow-2xl border border-stone-200/80 rounded-2xl p-4 z-50 flex items-center gap-3 text-sm max-w-sm animate-fade-in">
            {savingStatus === "idle" && (
              <>
                <div className="w-2 h-2 rounded-full bg-stone-300 animate-pulse" />
                <span className="text-stone-500 font-medium text-xs">
                  As alterações são salvas ao desfocar dos campos.
                </span>
              </>
            )}
            {savingStatus === "saving" && (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                <span className="text-red-600 font-bold text-xs">
                  Atualizando banco...
                </span>
              </>
            )}
            {savingStatus === "saved" && (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 font-bold text-xs">
                  Modificações salvas com sucesso!
                </span>
              </>
            )}
            {savingStatus === "error" && (
              <>
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-500 font-bold text-xs">
                  Falha de gravação no banco.
                </span>
              </>
            )}
          </div>

          {/* CATEGORY TABS AND CONTROL BAR */}
          {!searchTerm && (
            <CategoryTabs
              categorias={dados?.categorias || []}
              categoriaAtualIndex={categoriaAtual}
              onSelectCategoria={setCategoriaAtual}
              onAdicionarCategoria={adicionarCategoriaLocal}
              onRemoverCategoriaLocal={removerCategoria}
            />
          )}

          {/* MAIN PAGE INTERACTIVE WORKSPACE */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Global Search Filtering Interface */}
            {searchTerm ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold font-display text-stone-900">
                      Resultados da Busca para "{searchTerm}"
                    </h3>
                    <p className="text-xs text-stone-400">
                      Total de {searchResults.length} correspondências
                      encontradas
                    </p>
                  </div>
                  <button
                    onClick={() => setSearchTerm("")}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
                  >
                    <X className="w-3.5 h-3.5" />
                    Limpar Busca
                  </button>
                </div>

                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map((res, index) => (
                      <div
                        key={index}
                        className="bg-white p-4 rounded-xl border border-stone-200/60 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-sm bg-stone-100 text-stone-500 uppercase tracking-widest font-mono mb-2">
                            {res.categoryTitle.replace(
                              "RELAÇÃO DOS ATLETAS - ",
                              "",
                            )}
                          </span>
                          <h4 className="font-bold text-stone-800 text-sm uppercase">
                            {res.teamName}
                          </h4>
                          {res.athleteName && (
                            <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5 bg-stone-50 p-2 rounded-lg border border-stone-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                              <span>
                                Atleta:{" "}
                                <strong className="text-stone-700">
                                  {res.athleteName}
                                </strong>
                              </span>
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const catIdx = dados?.categorias.findIndex(
                              (c) => c.titulo === res.categoryTitle,
                            );
                            if (catIdx !== undefined && catIdx !== -1) {
                              setCategoriaAtual(catIdx);
                              setSearchTerm("");
                            }
                          }}
                          className="mt-4 text-left text-xs font-bold text-red-600 hover:text-red-700 transition"
                        >
                          Ir para esta categoria &rarr;
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-stone-200/80 p-12 text-center max-w-md mx-auto">
                    <Search className="w-8 h-8 text-stone-300 mx-auto mb-3" />
                    <h4 className="font-bold text-stone-800">
                      Nenhum resultado encontrado
                    </h4>
                    <p className="text-xs text-stone-400 mt-1">
                      Refine seus termos de busca ou tente pesquisar por
                      capitães escrevendo "(C)"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Standard View: Displays Active Category Teams List
              <div className="space-y-6">
                {/* AÇÕES GLOBAIS DO PAINEL - aparecem mesmo sem categoria */}
                <div className="flex items-center justify-end gap-2 flex-wrap">
                  <button
                    onClick={() => setIsGaleriaOpen(true)}
                    className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                  >
                    <Image className="w-4 h-4" />
                    <span>Galeria de Fotos</span>
                  </button>

                  <button
                    onClick={() => setIsAdminView(false)}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Sair do Painel
                  </button>
                </div>

                {/* Active Category Title and Quick Actions */}
                {activeCategoryObj && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={activeCategoryObj.titulo || ""}
                        onChange={(e) => handleCategoriaChange(e.target.value)}
                        onBlur={() =>
                          salvarAlteracaoNoServidor(
                            "categoria",
                            obterId(activeCategoryObj),
                            activeCategoryObj.titulo,
                          )
                        }
                        className="w-full text-stone-900 font-extrabold text-lg md:text-xl uppercase tracking-wider bg-transparent border-b border-transparent hover:border-stone-300 focus:border-red-600 focus:bg-stone-50 px-2 py-1 outline-hidden rounded-md transition duration-200"
                      />
                      <p className="text-[11px] text-stone-400 mt-1.5 px-2 font-medium">
                        Edite o título acima. As equipes serão salvas sob esta
                        categoria ({activeCategoryObj.equipes?.length || 0}{" "}
                        equipes inscritas).
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setIsChavesOpen(true)}
                        className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                      >
                        <FileImage className="w-4 h-4" />
                        <span>Formulário de Chaves</span>
                      </button>

                      <button
                        onClick={adicionarEquipeLocal}
                        className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-red-500/5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Adicionar Equipe</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Team Cards Bento Grid */}
                {activeCategoryObj &&
                activeCategoryObj.equipes &&
                activeCategoryObj.equipes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                      {activeCategoryObj.equipes.map((equipe, eqIdx) => (
                        <TeamCard
                          key={obterId(equipe) || `team-${eqIdx}`}
                          equipe={equipe}
                          eqIdx={eqIdx}
                          categoriaIdReal={obterId(activeCategoryObj)}
                          obterId={obterId}
                          onEquipeChange={handleEquipeChange}
                          onAtletaChange={handleAtletaChange}
                          onAdicionarAtletaLocal={adicionarAtletaLocal}
                          onSalvarAlteracao={salvarAlteracaoNoServidor}
                          onRemoverEquipeLocal={removerEquipe}
                          onRemoverAtletaLocal={removerAtleta}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-stone-200/80 p-16 text-center max-w-xl mx-auto">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
                      <Plus className="w-8 h-8 text-red-500 animate-pulse" />
                    </div>
                    <h4 className="text-lg font-bold text-stone-900 font-display">
                      Sem Equipes Cadastradas
                    </h4>
                    <p className="text-stone-400 text-sm mt-2 max-w-sm mx-auto">
                      Não há nenhuma equipe inscrita nesta categoria esportiva
                      ainda. Comece clicando no botão abaixo para registrar a
                      primeira.
                    </p>
                    <button
                      onClick={adicionarEquipeLocal}
                      className="mt-6 inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-stone-800 transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Cadastrar Primeira Equipe</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </>
      )}
      {/* Renderização condicional do formulário de chaves */}
      {isChavesOpen && (
        <FormularioChaves onClose={() => setIsChavesOpen(false)} />
      )}
      {/* Renderização condicional do formulário de chaves */}
      {isGaleriaOpen && (
        <GalleryAdmin onClose={() => setIsGaleriaOpen(false)} />
      )}
    </div>
  );
}
