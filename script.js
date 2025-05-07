import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
    import {
      getAuth,
      onAuthStateChanged,
      signInWithEmailAndPassword,
      signOut,
      GoogleAuthProvider,
      signInWithPopup,
      EmailAuthProvider,
      reauthenticateWithCredential,
    } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
    import {
      getFirestore,
      collection,
      addDoc,
      setDoc,
      query,
      where,
      getDocs,
      orderBy,
      limit,
      doc,
      writeBatch,
      deleteDoc,
      getDoc,
    } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Your web app's Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyAZsIso9U5xe4RLAbLuSWZb1Vufck_1ULo",
        authDomain: "geradorderecibo-e7339.firebaseapp.com",
        projectId: "geradorderecibo-e7339",
        storageBucket: "geradorderecibo-e7339.firebasestorage.app",
        messagingSenderId: "567493290213",
        appId: "1:567493290213:web:a1954f722436ff92bbcc0c",
        measurementId: "G-PF5JYYKDHP",
      };
  
      // Initialize Firebase
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const db = getFirestore(app);
  
      // Inicializa os labels quando a página carregar
      document.addEventListener('DOMContentLoaded', function() {
        alternarDocumento('geracao');
        alternarDocumento('consulta');
      });
  
      // Elements
      const loginScreen = document.getElementById("login-screen");
      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");
      const loginButton = document.getElementById("login-button");
      const googleLoginButton = document.getElementById("google-login-button");
      const errorMessage = document.getElementById("error-message");
      const mainContent = document.getElementById("main-content");
      const queryScreen = document.getElementById("query-screen");
      const queryButton = document.getElementById("open-query-button");
      const logoutButton = document.getElementById("logout-button");
  
      // Show or hide main content and login screen based on auth state
      document.addEventListener('DOMContentLoaded', () => {
        onAuthStateChanged(auth, (user) => {
          const loginScreen = document.getElementById("login-screen");
          const mainContent = document.getElementById("main-content");
          const logoutButton = document.getElementById("logout-button");
          const emailInput = document.getElementById("email");
          const passwordInput = document.getElementById("password");
          const errorMessage = document.getElementById("login-error");
  
          if (!loginScreen || !mainContent || !logoutButton) return;
  
          if (user) {
            loginScreen.classList.add("hidden");
            mainContent.style.display = "block";
            logoutButton.style.display = "block";
          } else {
            loginScreen.classList.remove("hidden");
            mainContent.style.display = "none";
            logoutButton.style.display = "none";
            if (emailInput) emailInput.value = "";
            if (passwordInput) passwordInput.value = "";
            if (errorMessage) errorMessage.textContent = "";
          }
        });
      });
  
      // Email/password login
      function hideLoginScreen() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-content').style.display = 'block';
        document.getElementById('logout-button').style.display = 'block';
      }
  
      async function signIn() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginError = document.getElementById('login-error');
  
        if (!email || !password) {
          loginError.textContent = 'Por favor, preencha todos os campos.';
          loginError.style.display = 'block';
          return;
        }
  
        try {
          await signInWithEmailAndPassword(auth, email, password);
          loginError.style.display = 'none';
          hideLoginScreen();
        } catch (error) {
          console.error('Erro ao fazer login:', error);
          let mensagemErro = 'Erro ao fazer login. Por favor, tente novamente.';
          
          if (error.code === 'auth/user-not-found') {
            mensagemErro = 'Usuário não encontrado. Por favor, verifique seu email.';
          } else if (error.code === 'auth/wrong-password') {
            mensagemErro = 'Senha incorreta. Por favor, tente novamente.';
          } else if (error.code === 'auth/invalid-email') {
            mensagemErro = 'Email inválido. Por favor, verifique o formato do email.';
          }
          
          loginError.textContent = mensagemErro;
          loginError.style.display = 'block';
        }
      }
  
      document.getElementById('login-button').addEventListener('click', signIn);
  
      document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          signIn();
        }
      });
  
      // Logout
      logoutButton.addEventListener("click", async () => {
        await signOut(auth);
      });
  
      // Save receipt to Firestore
      async function saveReceipt(receiptData) {
        try {
          await addDoc(collection(db, "recibos"), receiptData);
        } catch (error) {
          alert("Erro ao salvar recibo: " + error.message);
        }
      }
  
      // Query receipts by filters
      async function queryReceipts(filters) {
        let q = collection(db, "recibos");
        const conditions = [];
  
        if (filters.nome_cliente) {
          conditions.push(where("nome_cliente", "==", filters.nome_cliente));
        }
        if (filters.doc_cliente) {
          conditions.push(where("doc_cliente", "==", filters.doc_cliente));
        }
        if (filters.data) {
          conditions.push(where("data", "==", filters.data));
        }
  
        if (conditions.length > 0) {
    q = query(q, ...conditions); // sem orderBy
  } else {
    q = query(q, orderBy("data", "desc"), limit(50));
  }
  
  
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      }
  
      // Receipt generation and other functions moved inside module script for scope access
  
      let assinaturaDataUrl = null;
  
      document.getElementById("assinatura").addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file && file.type === "image/png") {
          const reader = new FileReader();
          reader.onload = function (e) {
            assinaturaDataUrl = e.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
  
      function alternarDocumento(contexto) {
        console.log('alternarDocumento chamado com contexto:', contexto);
        // Determina se é o contexto de geração ou consulta
        const isGeracao = contexto === 'geracao' || !contexto;
        
        // Pega o tipo de pessoa baseado no contexto
        const tipo = isGeracao 
          ? document.getElementById("tipoPessoa").value
          : document.getElementById("tipoPessoaConsulta").value;
  
        console.log('tipo selecionado:', tipo);
  
        if (isGeracao) {
          // Atualiza campos na tela de geração
          const labelDoc = document.querySelector("label[for='doc_cliente']");
          const labelNome = document.querySelector("label[for='nome_cliente']");
          
          if (labelDoc && labelNome) {
            labelDoc.textContent = tipo === "cpf" ? "CPF do Cliente:" : "CNPJ do Cliente:";
            labelNome.textContent = tipo === "cpf" ? "Nome do Cliente:" : "Razão Social do Cliente:";
            console.log('Labels da geração atualizados');
          } else {
            console.log('Labels da geração não encontrados');
          }
        } else {
          // Atualiza campos na tela de consulta
          const labelDocQuery = document.getElementById("label-query-doc");
          const labelNomeQuery = document.getElementById("label-query-nome");
          
          if (labelDocQuery && labelNomeQuery) {
            labelDocQuery.textContent = tipo === "cpf" ? "CPF do Cliente:" : "CNPJ do Cliente:";
            labelNomeQuery.textContent = tipo === "cpf" ? "Nome do Cliente:" : "Razão Social do Cliente:";
            console.log('Labels da consulta atualizados');
          } else {
            console.log('Labels da consulta não encontrados');
          }
        }
      }
  
      document.getElementById("doc_cliente").addEventListener("input", function () {
        const tipo = document.getElementById("tipoPessoa").value;
        let valor = this.value.replace(/\D/g, "");
  
        if (tipo === "cpf") {
          valor = valor
            .slice(0, 11)
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        } else {
          valor = valor
            .slice(0, 14)
            .replace(/(\d{2})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1/$2")
            .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
        }
  
        this.value = valor;
      });
  
      document.getElementById("cpf_emitente").addEventListener("input", function () {
        let valor = this.value.replace(/\D/g, "");
        valor = valor
          .slice(0, 11)
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        this.value = valor;
      });
  
      // Adiciona os event listeners quando o documento estiver carregado
      document.addEventListener('DOMContentLoaded', function() {
        const queryDoc = document.getElementById("consulta_doc");
        if (queryDoc) {
          queryDoc.addEventListener("input", function () {
            const tipo = document.getElementById("tipoPessoaConsulta").value;
            let valor = this.value.replace(/\D/g, "");
  
            if (tipo === "cpf") {
              valor = valor
                .slice(0, 11)
                .replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
            } else {
              valor = valor
                .slice(0, 14)
                .replace(/(\d{2})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d)/, "$1/$2")
                .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
            }
  
            this.value = valor;
          });
        }
      });
 
      function validarCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g, "");
        if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
        let soma = 0;
        for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
        let resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.charAt(9))) return false;
        soma = 0;
        for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        return resto === parseInt(cpf.charAt(10));
      }
  
      function validarCNPJ(cnpj) {
        cnpj = cnpj.replace(/[^\d]+/g, "");
        if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
        let tamanho = cnpj.length - 2;
        let numeros = cnpj.substring(0, tamanho);
        let digitos = cnpj.substring(tamanho);
        let soma = 0;
        let pos = tamanho - 7;
        for (let i = tamanho; i >= 1; i--) {
          soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
          if (pos < 2) pos = 9;
        }
        let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
        if (resultado !== parseInt(digitos.charAt(0))) return false;
        tamanho += 1;
        numeros = cnpj.substring(0, tamanho);
        soma = 0;
        pos = tamanho - 7;
        for (let i = tamanho; i >= 1; i--) {
          soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
          if (pos < 2) pos = 9;
        }
        resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
        return resultado === parseInt(digitos.charAt(1));
      }
  
      async function gerarRecibo() {
        const tipo = document.getElementById("tipoPessoa").value;
      
        const emitente = document.getElementById("nome_emitente").value.trim();
        const cpf_emitente = document.getElementById("cpf_emitente").value.trim();
        const cliente = document.getElementById("nome_cliente").value.trim();
        const doc_cliente = document.getElementById("doc_cliente").value.trim();
        const valor = document.getElementById("valor").value.trim();
        const extenso = document.getElementById("extenso").value.trim();
        const descricao = document.getElementById("descricao").value.trim();
        const local = document.getElementById("local").value.trim();
        const data = document.getElementById("data").value;
      
        // validação dos campos obrigatórios
        if (
          !emitente ||
          !cpf_emitente ||
          !cliente ||
          !doc_cliente ||
          !valor ||
          !extenso ||
          !descricao ||
          !local ||
          !data
        ) {
          alert("Por favor, preencha todos os campos obrigatórios.");
          return;
        }
      
        // Usando a variável global da assinatura
        const assinaturaDataUrl = window.assinaturaDataUrl || "";
      
        const recibo = {
          tipo,
          emitente,
          cpf_emitente,
          nome_cliente: cliente,
          doc_cliente,
          valor,
          extenso,
          descricao,
          local,
          data,
          assinaturaDataUrl
        };
      
        const reciboDiv = document.getElementById("recibo");
        reciboDiv.innerHTML = montarHTMLRecibo(recibo);
      
        // Tornar visível
        reciboDiv.style.display = "block";
        reciboDiv.style.position = "relative";
      
        // Gera a imagem após a renderização
        setTimeout(() => {
          gerarImagemDoRecibo(); // usa o recibo que está na tela
          document.getElementById("btnDownload").style.display = "inline-block";
          document.getElementById("btnCompartilhar").style.display = "inline-block";
          document.getElementById("btnSalvarFirebase").style.display = "inline-block";
        }, 100);
      }
      
  
      //  ESTA FUNÇÃO DEVE FICAR FORA DA OUTRA salvar o recibo no fire
      async function salvarRecibo() {
        const user = auth.currentUser;
        if (!user) {
          alert("Por favor, faça login antes de salvar o recibo.");
          return;
        }
      
        const tipo = document.getElementById("tipoPessoa").value;
        const emitente = document.getElementById("nome_emitente").value.trim();
        const cpf_emitente = document.getElementById("cpf_emitente").value.trim();
        const cliente = document.getElementById("nome_cliente").value.trim();
        const doc_cliente = document.getElementById("doc_cliente").value.trim();
        const valor = document.getElementById("valor").value.trim();
        const extenso = document.getElementById("extenso").value.trim();
        const descricao = document.getElementById("descricao").value.trim();
        const local = document.getElementById("local").value.trim();
        const data = document.getElementById("data").value;
      
        try {
          const recibosRef = collection(db, 'recibos');
          const snapshot = await getDocs(recibosRef);
      
          let maiorId = 0;
          snapshot.forEach(doc => {
            const dados = doc.data();
            if (dados.reciboId && Number.isInteger(dados.reciboId)) {
              maiorId = Math.max(maiorId, dados.reciboId);
            }
          });
      
          const novoReciboId = maiorId + 1;
          const docId = `${novoReciboId} - ${cliente}`;
      
          const receiptData = {
            reciboId: novoReciboId,
            email: user.email,
            tipo,
            emitente,
            cpf_emitente,
            nome_cliente: cliente,
            doc_cliente,
            valor,
            extenso,
            descricao,
            local,
            data,
            timestamp: new Date().toISOString(),
          };
      
          await setDoc(doc(recibosRef, docId), receiptData);
      
          alert(`Recibo salvo com sucesso! ID: ${novoReciboId}`);
        } catch (error) {
          alert("Erro ao salvar recibo: " + error.message);
        }
      }
      
  
      function gerarImagemDoRecibo() {
        html2canvas(document.getElementById("recibo"), { scale: 2 }).then((canvas) => {
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const downloadLink = document.createElement("a");
            downloadLink.href = url;
            downloadLink.download = "recibo.png";
            document.getElementById("btnDownload").onclick = () => downloadLink.click();
          });
        });
      }
      function baixarImagem() {
        // esse clique será acionado dinamicamente após gerarRecibo()
      }
  
      async function compartilharPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  
        const recibo = document.getElementById("recibo");
        const canvas = await html2canvas(recibo, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
  
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const imgProps = doc.getImageProperties(imgData);
  
        const pdfWidth = pageWidth - 40;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        const marginTop = 20;
  
        doc.addImage(imgData, "PNG", 20, marginTop, pdfWidth, pdfHeight);
  
        const blob = doc.output("blob");
        const file = new File([blob], "recibo.pdf", { type: "application/pdf" });
  
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: "Recibo", text: "Confira o recibo gerado." });
          } catch (err) {
            alert("Compartilhamento cancelado ou não suportado.");
          }
        } else {
          alert("Este navegador não suporta compartilhamento de arquivos.");
        }
      }
  
      function formataData(dataISO) {
        const [ano, mes, dia] = dataISO.split("-");
        const meses = [
          "janeiro",
          "fevereiro",
          "março",
          "abril",
          "maio",
          "junho",
          "julho",
          "agosto",
          "setembro",
          "outubro",
          "novembro",
          "dezembro",
        ];
        return `${dia} de ${meses[parseInt(mes, 10) - 1]} de ${ano}`;
      }
  
      // Consult receipts from Firestore based on filters 
      async function consultarRecibos() {
        try {
          const user = auth.currentUser;
          if (!user) {
            Swal.fire('Erro!', 'Você precisa estar logado para consultar recibos.', 'error');
            return;
          }
      
          const docCliente = document.getElementById('consulta_doc').value.trim();
          const nomeCliente = document.getElementById('consulta_nome').value.trim();
          const dataRecibo = document.getElementById('consulta_data').value;
      
          if (!docCliente && !nomeCliente && !dataRecibo) {
            Swal.fire('Atenção!', 'Preencha pelo menos um campo para realizar a busca.', 'warning');
            return;
          }
      
          // Começa com a coleção completa (sem filtro por userId)
          let q = collection(db, 'recibos');
      
          let filtros = [];
      
          if (docCliente) filtros.push(where('doc_cliente', '==', docCliente));
          if (nomeCliente) filtros.push(where('nome_cliente', '==', nomeCliente));
          if (dataRecibo) filtros.push(where('data', '==', dataRecibo));
      
          // Se houver filtros, aplica todos com query encadeada
          if (filtros.length > 0) {
            q = query(q, ...filtros);
          }
      
          const querySnapshot = await getDocs(q);
          const recibosContainer = document.getElementById('recibos-container');
          recibosContainer.innerHTML = '';
      
          if (querySnapshot.empty) {
            const div = document.createElement("div");
            div.innerHTML = `Nenhum recibo encontrado.`;
            recibosContainer.appendChild(div);
            return;
          }
      
          querySnapshot.forEach((doc) => {
            const recibo = doc.data();
            const div = document.createElement("div");
            div.className = "result-item";
            div.innerHTML = `
              <div class="receipt-info">
                <strong>Nome:</strong> ${recibo.nome_cliente} <br />
                <strong>Documento:</strong> ${recibo.doc_cliente} <br />
                <strong>Data:</strong> ${formataData(recibo.data)} <br />
                <strong>Valor:</strong> R$${recibo.valor} <br />
                <strong>Descrição:</strong> ${recibo.descricao}
              </div>
              <div class="receipt-actions">
                <button class="action-button download-img" onclick="visualizarImagemRecibo('${doc.id}')" title="Visualizar Recibo">
                  <i class="fas fa-image"></i>
                </button>
                <button class="action-button download-pdf" onclick="baixarPDFRecibo('${doc.id}')" title="Baixar PDF">
                  <i class="fas fa-file-pdf"></i>
                </button>
                <button class="action-button edit" onclick="editarRecibo('${doc.id}')" title="Editar Recibo">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="action-button delete" onclick="excluirRecibo('${doc.id}')" title="Excluir Recibo">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            `;
            recibosContainer.appendChild(div);
          });
        } catch (error) {
          console.error('Erro ao consultar recibos:', error);
          Swal.fire('Erro!', 'Ocorreu um erro ao consultar recibos: ' + error.message, 'error');
        }
      }
      
  

      async function visualizarImagemRecibo(reciboId) {
        try {
          const reciboRef = doc(db, 'recibos', reciboId);
          const reciboDoc = await getDoc(reciboRef);
          
          if (!reciboDoc.exists()) {
            throw new Error('Recibo não encontrado');
          }
          
          const recibo = reciboDoc.data();
          console.log("Dados do recibo:", recibo); // Verifica os dados completos do recibo
      
          // Garantir que o campo emitente está sendo acessado corretamente
          const emitente = recibo.emitente;
          if (!emitente) {
            throw new Error("Campo 'emitente' não encontrado ou está vazio.");
          }
      
          const cpf_emitente = recibo.cpf_emitente;
          const cliente = recibo.nome_cliente;
          const doc_cliente = recibo.doc_cliente;
          const valor = recibo.valor;
          const extenso = recibo.extenso;
          const descricao = recibo.descricao;
          const local = recibo.local;
          const data = recibo.data;
          const assinaturaDataUrl = recibo.assinaturaDataUrl;
      
          if (!cpf_emitente || !cliente || !doc_cliente || !valor || !extenso || !descricao || !local || !data) {
            alert("Por favor, preencha todos os campos obrigatórios no Firestore.");
            return;
          }
      
          const reciboDiv = document.createElement('div');
          reciboDiv.className = 'recibo';
          reciboDiv.style.padding = '20px';
          reciboDiv.style.background = '#fff';
          reciboDiv.style.color = '#000';
          reciboDiv.style.width = '300px';
          reciboDiv.style.fontFamily = 'sans-serif';
          reciboDiv.innerHTML = montarHTMLRecibo(recibo);
        
          // Adiciona ao DOM de forma invisível
          reciboDiv.style.position = 'absolute';
          reciboDiv.style.top = '-9999px';
          document.body.appendChild(reciboDiv);
      
          // Gera imagem com html2canvas
          const canvas = await html2canvas(reciboDiv, { scale: 2 });
          const imageURL = canvas.toDataURL('image/png');
      
          // Remove o recibo temporário
          document.body.removeChild(reciboDiv);
      
          // Abre modal com a visualização do recibo
          const modal = document.createElement('div');
          modal.innerHTML = `
            <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:#000a;display:flex;justify-content:center;align-items:center;z-index:9999;">
              <div style="background:white;padding:10px;border-radius:10px;text-align:center;max-width:90%;">
                <div style="max-width:100%;height:auto;">
                  <img src="${imageURL}" style="max-width:100%;height:auto;" />
                </div>
                <br/>
                <button onclick="baixarImagemViewer('${imageURL}', 'recibo-${reciboId}.png')">Baixar</button>
                <button onclick="this.parentElement.parentElement.remove()">Fechar</button>
              </div>
            </div>
          `;
          document.body.appendChild(modal);
      
        } catch (error) {
          console.error('Erro ao visualizar recibo:', error);
          alert('Erro ao visualizar recibo: ' + error.message);
        }
      }
      
      function baixarImagemViewer(imageURL, nomeArquivo) {
        const link = document.createElement('a');
        link.href = imageURL;
        link.download = nomeArquivo;
        link.click();
      }
            
      function montarHTMLRecibo(recibo) {
        return `
          <div style="text-align: center;">
            <img src="logo.png" alt="Logo" style="max-width: 120px; margin-bottom: 10px;" />
            <h2 style="margin: 0 0 10px;">RECIBO</h2>
          </div>
          <p style="font-size: 14px; line-height: 1.5; text-align: justify;">
          Eu, <strong>${recibo.emitente}</strong> inscrito (a) no CPF ${recibo.cpf_emitente}, declaro que recebi de <strong>${recibo.nome_cliente}</strong>, inscrito(a) no ${recibo.tipo === "cpf" ? "CPF nº" : "CNPJ nº"} ${recibo.doc_cliente}, a importância de R$${recibo.valor} (${recibo.extenso}), referente ao pagamento correspondente à ${recibo.descricao}.
          </p>
          <p style="font-size: 14px; line-height: 1.4;">${recibo.local}, ${formataData(recibo.data)}.</p>
          <br>
          ${recibo.assinaturaDataUrl ? `<div style="text-align:center;"><img src="${recibo.assinaturaDataUrl}" alt="Assinatura" style="max-width: 100%; height: 40px;"><br></div>` : ""}
          <div style="text-align: center; margin-top: 10px;">
            <p style="margin: 4px 0;">____________________________</p>
            <p style="margin: 2px 0; font-size: 13px;"><strong>${recibo.emitente}</strong></p>
            <p style="margin: 0; font-size: 13px;">CPF: ${recibo.cpf_emitente}</p>
          </div>
          <br>
          <div style="text-align: center; font-size: 11px; color: #333;">
            <p style="margin: 2px 0;">Rodovia Jorge Amando, 138</p> 
            <p style="margin: 0;">Banco da Vitória - Ilhéus/BA</p>
            <p style="margin: 0;">CEP: 45.661-200 • Contato : (73) 98132-5306</p>
          </div>
        `;
      }
      




      // Funções para o cadastro de modelo
      function splitIntoChunks(str, size) {
        const chunks = [];
        for (let i = 0; i < str.length; i += size) {
          chunks.push(str.slice(i, i + size));
        }
        return chunks;
      }
  
      function validarChunk(chunk) {
        const byteSize = new Blob([chunk]).size;
        return byteSize <= 800000; // 800KB limite seguro
      }
  
      async function salvarChunks(modeloId, chunks) {
        const chunksRef = collection(db, 'modelos_recibo', modeloId, 'chunks');
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          if (!validarChunk(chunk)) {
            throw new Error('Chunk muito grande. Por favor, use um arquivo menor.');
          }
          await addDoc(chunksRef, {
            conteudo: chunk,
            ordem: i
          });
        }
      }
  
      async function carregarModelos() {
        try {
          const modelosRef = collection(db, 'modelos_recibo');
          const q = query(modelosRef, orderBy('dataCriacao', 'desc'));
          const querySnapshot = await getDocs(q);
  
          const listaModelos = document.getElementById('listaModelos');
          if (querySnapshot.empty) {
            listaModelos.innerHTML = '<p>Nenhum modelo cadastrado.</p>';
            return;
          }
  
          let html = '';
          querySnapshot.forEach((doc) => {
            const modelo = doc.data();
            html += `
              <div class="modelo-item">
                <div class="modelo-info">
                  <div class="modelo-nome">${modelo.nome}</div>
                  <div class="modelo-titulo">${modelo.titulo}</div>
                  <div class="modelo-data">${formatarData(modelo.dataCriacao)}</div>
                </div>
                <div class="modelo-acoes">
                  <button class="btn-excluir" onclick="excluirModelo('${doc.id}')">Excluir</button>
                </div>
              </div>
            `;
          });
  
          listaModelos.innerHTML = html;
        } catch (error) {
          console.error('Erro ao carregar modelos:', error);
          document.getElementById('listaModelos').innerHTML = 
            '<div class="error-message">Erro ao carregar modelos.</div>';
        }
      }
  
      async function excluirModelo(id) {
        if (!confirm('Tem certeza que deseja excluir este modelo?')) {
          return;
        }
  
        try {
          // Primeiro excluir todos os chunks
          const chunksRef = collection(db, 'modelos_recibo', id, 'chunks');
          const chunksSnapshot = await getDocs(chunksRef);
          const batch = writeBatch(db);
  
          chunksSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
          });
  
          // Depois excluir o documento principal
          const modeloRef = doc(db, 'modelos_recibo', id);
          batch.delete(modeloRef);
  
          await batch.commit();
          await carregarModelos();
        } catch (error) {
          console.error('Erro ao excluir modelo:', error);
          alert('Erro ao excluir modelo: ' + error.message);
        }
      }
  
      // Adiciona listener para o input de arquivo
      document.getElementById('rtfFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) {
          document.querySelector('.file-info').style.display = 'none';
          return;
        }
  
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = (file.size / 1024).toFixed(2);
        document.querySelector('.file-info').style.display = 'block';
      });
  
      async function salvarModelo() {
        const nome = document.getElementById('nome').value.trim();
        const titulo = document.getElementById('titulo').value.trim();
        const rtfFile = document.getElementById('rtfFile').files[0];
        const errorDiv = document.querySelector('.error-message');
        const successDiv = document.querySelector('.success-message');
        const loader = document.querySelector('.loader');
        const savingText = document.querySelector('.saving-text');
  
        errorDiv.style.display = 'none';
        successDiv.style.display = 'none';
        loader.style.display = 'none';
        savingText.style.display = 'none';
  
        if (!nome || !titulo || !rtfFile) {
          errorDiv.textContent = 'Por favor, preencha todos os campos e selecione um arquivo.';
          errorDiv.style.display = 'block';
          return;
        }
  
        try {
          // Verificar se já existe um modelo com o mesmo nome
          const modelosRef = collection(db, 'modelos_recibo');
          const q = query(modelosRef, where('nome', '==', nome));
          const querySnapshot = await getDocs(q);
  
          if (!querySnapshot.empty) {
            errorDiv.textContent = 'Já existe um modelo com este nome. Por favor, escolha outro nome.';
            errorDiv.style.display = 'block';
            return;
          }
  
          // Ler o arquivo RTF
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              // Mostrar loader
              loader.style.display = 'block';
              savingText.style.display = 'block';
              savingText.textContent = 'Preparando arquivo...';
  
              const arquivo = e.target.result;
              const chunks = splitIntoChunks(arquivo, 100000); // Dividir em chunks de 100KB
              
              savingText.textContent = 'Criando documento principal...';
              // Criar documento principal
              const modeloRef = await addDoc(collection(db, 'modelos_recibo'), {
                nome: nome,
                titulo: titulo,
                numChunks: chunks.length,
                dataCriacao: new Date().toISOString()
              });
  
              // Salvar chunks
              savingText.textContent = 'Salvando chunks do arquivo...';
              await salvarChunks(modeloRef.id, chunks);
  
              // Limpar formulário
              document.getElementById('nome').value = '';
              document.getElementById('titulo').value = '';
              document.getElementById('rtfFile').value = '';
              document.getElementById('fileName').textContent = 'Nenhum arquivo';
              document.getElementById('fileSize').textContent = '0';
              document.querySelector('.file-info').style.display = 'none';
  
              // Esconder loader
              loader.style.display = 'none';
              savingText.style.display = 'none';
  
              // Mostrar mensagem de sucesso
              successDiv.textContent = 'Modelo salvo com sucesso!';
              successDiv.style.display = 'block';
  
              // Recarregar lista de modelos
              await carregarModelos();
            } catch (error) {
              console.error('Erro ao salvar modelo:', error);
              errorDiv.textContent = 'Erro ao salvar no Firestore: ' + error.message;
              errorDiv.style.display = 'block';
              // Esconder loader em caso de erro
              loader.style.display = 'none';
              savingText.style.display = 'none';
            }
          };
  
          reader.readAsText(rtfFile);
        } catch (error) {
          console.error('Erro ao salvar modelo:', error);
          errorDiv.textContent = 'Erro ao salvar modelo: ' + error.message;
          errorDiv.style.display = 'block';
        }
      }
  
      function formatarData(dataString) {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
  
  
  
      // Funções para manipular recibos na consulta
      async function baixarImagemRecibo(reciboId) {
        try {
          const reciboRef = doc(db, 'recibos', reciboId);
          const reciboDoc = await getDoc(reciboRef);
          if (!reciboDoc.exists()) {
            throw new Error('Recibo não encontrado');
          }
          const recibo = reciboDoc.data();
          
          // Recria o recibo visualmente
          const reciboDiv = document.createElement('div');
          reciboDiv.className = 'recibo';
          reciboDiv.style.display = 'block';
          // Aqui você deve recriar o HTML do recibo com os dados
          // Similar à função gerarRecibo()
          
          // Gera e baixa a imagem
          html2canvas(reciboDiv, { scale: 2 }).then((canvas) => {
            canvas.toBlob((blob) => {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `recibo-${reciboId}.png`;
              a.click();
              URL.revokeObjectURL(url);
            });
          });
        } catch (error) {
          console.error('Erro ao baixar imagem:', error);
          alert('Erro ao gerar imagem do recibo: ' + error.message);
        }
      }
  
      async function baixarPDFRecibo(reciboId) {
        try {
          const reciboRef = doc(db, 'recibos', reciboId);
          const reciboDoc = await getDoc(reciboRef);
          if (!reciboDoc.exists()) {
            throw new Error('Recibo não encontrado');
          }
          const recibo = reciboDoc.data();
          
          // Recria o recibo visualmente
          const reciboDiv = document.createElement('div');
          reciboDiv.className = 'recibo';
          reciboDiv.style.display = 'block';
          // Aqui você deve recriar o HTML do recibo com os dados
          // Similar à função gerarRecibo()
          
          // Gera e baixa o PDF
          html2canvas(reciboDiv, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF();
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`recibo-${reciboId}.pdf`);
          });
        } catch (error) {
          console.error('Erro ao baixar PDF:', error);
          alert('Erro ao gerar PDF do recibo: ' + error.message);
        }
      }
  
      function editarRecibo(reciboId) {
        // Funcionalidade de edição será implementada posteriormente
        alert('Funcionalidade de edição em desenvolvimento');
      }
  
      async function excluirRecibo(reciboId) {
        try {
          const user = auth.currentUser;
          if (!user) {
            Swal.fire('Erro!', 'Você precisa estar logado para excluir um recibo.', 'error');
            return;
          }
  
          const result = await Swal.fire({
            title: 'Confirmar exclusão',
            text: 'Digite sua senha para confirmar a exclusão do recibo',
            input: 'password',
            inputPlaceholder: 'Digite sua senha',
            showCancelButton: true,
            confirmButtonText: 'Excluir',
            cancelButtonText: 'Cancelar',
            showLoaderOnConfirm: true,
            preConfirm: async (senha) => {
              if (!senha) {
                Swal.showValidationMessage('Por favor, digite sua senha');
                return false;
              }
              
              try {
                // Reautenticar o usuário
                await signInWithEmailAndPassword(auth, user.email, senha);
                
                // Se a autenticação foi bem sucedida, exclui o recibo
                await deleteDoc(doc(db, 'recibos', reciboId));
                return true;
              } catch (error) {
                console.error('Erro na reautenticação:', error);
                if (error.code === 'auth/wrong-password') {
                  Swal.showValidationMessage('Senha incorreta');
                } else {
                  Swal.showValidationMessage('Erro ao autenticar: ' + error.message);
                }
                return false;
              }
            },
            allowOutsideClick: () => !Swal.isLoading()
          });
  
          if (result.isConfirmed) {
            await Swal.fire(
              'Excluído!',
              'O recibo foi excluído com sucesso.',
              'success'
            );
            // Recarrega a lista de recibos
            await consultarRecibos();
          }
        } catch (error) {
          console.error('Erro ao excluir recibo:', error);
          Swal.fire(
            'Erro!',
            'Ocorreu um erro ao excluir o recibo: ' + error.message,
            'error'
          );
        }
      }
  
      function limparCampos() {
        document.getElementById('unitForm').reset();
        // Limpar campos do formulário
        document.getElementById('nome_emitente').value = '';
        document.getElementById('cpf_emitente').value = '';
        document.getElementById('nome_cliente').value = '';
        document.getElementById('doc_cliente').value = '';
        document.getElementById('valor').value = '';
        document.getElementById('extenso').value = '';
        document.getElementById('descricao').value = '';
        document.getElementById('local').value = '';
        document.getElementById('data').value = '';
        document.getElementById('assinatura').value = '';
  
        // Ocultar recibo e botões
        const recibo = document.getElementById('recibo');
        recibo.style.display = 'none';
        recibo.innerHTML = '';
  
        document.getElementById('btnDownload').style.display = 'none';
        document.getElementById('btnCompartilhar').style.display = 'none';
        document.getElementById('btnSalvarFirebase').style.display = 'none';
  
        // Limpar mensagens de erro
        document.getElementById('erro_doc_cliente').textContent = '';
      }
  
      function limparConsulta() {
        document.getElementById('consultaForm').reset();
        // Limpar campos de busca
        document.getElementById('consulta_doc').value = '';
        document.getElementById('consulta_nome').value = '';
        document.getElementById('consulta_data').value = '';
  
        // Limpar resultados
        const recibosContainer = document.getElementById('recibos-container');
        recibosContainer.innerHTML = '';
      }
  
      function openTab(evt, tabName) {
        // Ocultar todas as abas
        const tabContent = document.getElementsByClassName('tab-content');
        for (let i = 0; i < tabContent.length; i++) {
          tabContent[i].style.display = 'none';
        }
  
        // Remover a classe 'active' de todos os botões
        const tabButtons = document.getElementsByClassName('tab-button');
        for (let i = 0; i < tabButtons.length; i++) {
          tabButtons[i].classList.remove('active');
        }
  
        // Mostrar a aba selecionada e ativar o botão
        document.getElementById(tabName).style.display = 'block';
        evt.currentTarget.classList.add('active');
  
        // Limpar campos e resultados quando mudar de aba
        if (tabName !== 'tab-consulta') {
          limparConsulta();
        }
      }
  
      // Exporta funções para o escopo global
      window.gerarRecibo = gerarRecibo;
      window.compartilharPDF = compartilharPDF;
      window.consultarRecibos = consultarRecibos;
      window.alternarDocumento = alternarDocumento;
      window.baixarImagem = baixarImagem;
      window.validarCPF = validarCPF;
      window.validarCNPJ = validarCNPJ;
      window.formataData = formataData;
      window.assinaturaDataUrl = assinaturaDataUrl;
      window.saveReceipt = saveReceipt;
      window.queryReceipts = queryReceipts;
      window.salvarRecibo = salvarRecibo;
      window.openTab = openTab;
      window.salvarModelo = salvarModelo;
      window.excluirModelo = excluirModelo;
      window.baixarImagemRecibo = baixarImagemRecibo;
      window.baixarPDFRecibo = baixarPDFRecibo;
      window.editarRecibo = editarRecibo;
      window.excluirRecibo = excluirRecibo;
      window.limparCampos = limparCampos;
      window.limparConsulta = limparConsulta;
      window.carregarModelos = carregarModelos;
      window.visualizarImagemRecibo = visualizarImagemRecibo;
      window.baixarImagemViewer = baixarImagemViewer;
      window.carregarModelos = carregarModelos;
      montarHTMLRecibo = montarHTMLRecibo;
      
  