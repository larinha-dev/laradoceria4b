document.addEventListener("DOMContentLoaded", async () => {
  const ctx = document.getElementById("doceChart").getContext("2d");

  async function fetchDados() {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/relatorios/doce-mais-pedido", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });

      if (!res.ok) throw new Error("Erro ao conectar com backend");

      const dados = await res.json();
      return dados;

    } catch (err) {
      console.warn("Usando dados fictícios:", err.message);

      // 🔮 Dados de exemplo caso a API ainda não esteja pronta
      return [
        { nome: "Brigadeiro", total: 50 },
        { nome: "Beijinho", total: 30 }
      ];
    }
  }

  function prepararTop5(lista) {
    // Ordena
    lista.sort((a, b) => b.total - a.total);

    // Mantém só 5 maiores
    const top5 = lista.slice(0, 5);

    return {
      labels: top5.map(d => d.nome),
      valores: top5.map(d => d.total)
    };
  }

  async function gerarGrafico() {
    const lista = await fetchDados();
    const { labels, valores } = prepararTop5(lista);

    new Chart(ctx, {
      type: "pie",
      data: {
        labels,
        datasets: [{
          label: "Mais vendidos",
          data: valores,
          backgroundColor: [
            "#7b3fa0",
            "#b388eb",
            "#c8a2ff",
            "#e1c9ff",
            "#f2e7ff"
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: { size: 14 }
            }
          },
          title: {
            display: true,
            text: "Top 5 doces mais vendidos",
            font: { size: 18 },
            color: "#4b2b6d",
            padding: 12
          }
        }
      }
    });
  }

  gerarGrafico();
});
