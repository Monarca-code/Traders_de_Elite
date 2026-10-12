// =====================================================
// TRADERS DE ELITE — ÁREA ADMINISTRATIVA
// Cursos → Módulos → Aulas
// =====================================================

let courses = [];
let currentModules = [];

// =====================================================
// SEGURANÇA ADMINISTRATIVA
// O acesso é permitido somente ao e-mail abaixo.
// A senha NÃO é armazenada neste JavaScript: ela deve ser configurada no Appwrite Auth.

// UTILITÁRIOS
// =====================================================

const ADMIN_EMAIL = "tradersdeelite2026@gmail.com";

async function requireAdmin() {
    try {
        const user = await account.get();

        if ((user.email || "").toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            console.warn("⛔ Acesso administrativo recusado:", user.email);

            try {
                await account.deleteSession("current");
            } catch (_) {}

            alert("Acesso restrito ao administrador.");
            window.location.href = "../login.html";
            return null;
        }

        console.log("✅ Administrador autorizado:", user.email);
        return user;

    } catch (error) {
        console.warn("⚠️ Sessão administrativa não autenticada.");

        window.location.href = "../login.html";
        return null;
    }
}

function escapeHtml(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[character])
    );
}

function showError(message, error = null) {
    console.error(message, error || "");
    alert(
        message +
        (error?.message ? `\n\n${error.message}` : "")
    );
}

function youtubeVideoId(value) {
    if (!value) return null;

    try {
        const url = new URL(value.trim());
        const host = url.hostname.replace("www.", "");

        if (host === "youtu.be") {
            return url.pathname.replace("/", "").split("/")[0] || null;
        }

        if (host === "youtube.com" || host === "m.youtube.com") {
            if (url.pathname === "/watch") {
                return url.searchParams.get("v");
            }

            if (url.pathname.startsWith("/shorts/")) {
                return url.pathname.split("/")[2] || null;
            }

            if (url.pathname.startsWith("/embed/")) {
                return url.pathname.split("/")[2] || null;
            }
        }
    } catch (_) {
        return null;
    }

    return null;
}

function youtubeEmbedUrl(value) {
    const id = youtubeVideoId(value);
    return id
        ? `https://www.youtube.com/embed/${encodeURIComponent(id)}`
        : null;
}

function setVideoPreview(url) {
    const preview = document.getElementById("lessonVideoPreview");
    if (!preview) return;

    const embed = youtubeEmbedUrl(url);

    if (!embed) {
        preview.innerHTML = `
            <div class="video-preview-empty">
                Cole um link válido do YouTube para visualizar o vídeo.
            </div>
        `;
        return;
    }

    preview.innerHTML = `
        <iframe
            src="${escapeHtml(embed)}"
            title="Pré-visualização do vídeo"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen>
        </iframe>
    `;
}

// =====================================================
// CURSOS
// =====================================================

async function loadCourses() {
    const list = document.getElementById("coursesList");

    if (!list) return;

    list.innerHTML = `<div class="loading">A carregar cursos...</div>`;

    try {
        const result = await databases.listDocuments(
            DATABASE_ID,
            COURSES_COLLECTION_ID,
            [
                Appwrite.Query.orderAsc("titulo"),
                Appwrite.Query.limit(100)
            ]
        );

        courses = result.documents;

        console.log("📚 Cursos:", courses);

        renderCourses(courses);
        populateCourseSelect(courses);
    } catch (error) {
        showError("Não foi possível carregar os cursos.", error);
        list.innerHTML = `
            <div class="empty-message">
                Não foi possível carregar os cursos.
            </div>
        `;
    }
}

function renderCourses(list) {
    const container = document.getElementById("coursesList");

    if (!list.length) {
        container.innerHTML = `
            <div class="empty-message">
                Ainda não existem cursos cadastrados.
            </div>
        `;
        return;
    }

    container.innerHTML = list.map(course => {
        const published = course.publicado !== false;

        return `
            <article class="item-card">
                <div class="admin-course-main">
                    ${
                        course.imagem
                            ? `<img
                                class="admin-course-image"
                                src="${escapeHtml(course.imagem)}"
                                alt="${escapeHtml(course.titulo)}"
                                loading="lazy"
                            >`
                            : `<div class="admin-course-image admin-course-image-empty">CURSO</div>`
                    }

                    <div class="item-info">
                        <div class="admin-item-topline">
                            <h3>${escapeHtml(course.titulo)}</h3>
                            <span class="status-badge ${published ? "published" : "draft"}">
                                ${published ? "Publicado" : "Rascunho"}
                            </span>
                        </div>

                        <p>${escapeHtml(course.descricao || "Sem descrição.")}</p>

                        <small class="admin-id">
                            ID: ${escapeHtml(course.$id)}
                        </small>
                    </div>
                </div>

                <div class="item-actions">
                    <button
                        type="button"
                        class="small-button edit-button"
                        onclick="editCourse('${course.$id}')">
                        Editar
                    </button>

                    <button
                        type="button"
                        class="small-button delete-button"
                        onclick="deleteCourse('${course.$id}')">
                        Eliminar
                    </button>
                </div>
            </article>
        `;
    }).join("");
}

function populateCourseSelect(list) {
    const select = document.getElementById("moduleCourseSelect");
    if (!select) return;

    const current = select.value;

    select.innerHTML = `
        <option value="">Selecione um curso</option>
        ${list.map(course => `
            <option value="${escapeHtml(course.$id)}">
                ${escapeHtml(course.titulo)}
            </option>
        `).join("")}
    `;

    if (list.some(course => course.$id === current)) {
        select.value = current;
    }
}

function openCourseModal(course = null) {
    document.getElementById("courseModalTitle").textContent =
        course ? "Editar curso" : "Novo curso";

    document.getElementById("courseId").value =
        course?.$id || "";

    document.getElementById("courseTitle").value =
        course?.titulo || "";

    document.getElementById("courseDescription").value =
        course?.descricao || "";

    document.getElementById("courseImage").value =
        course?.imagem || "";

    document.getElementById("coursePublished").checked =
        course?.publicado !== false;

    document.getElementById("courseModal").classList.add("active");
}

function closeCourseModal() {
    document.getElementById("courseModal")?.classList.remove("active");
}

async function editCourse(courseId) {
    try {
        const course = await databases.getDocument(
            DATABASE_ID,
            COURSES_COLLECTION_ID,
            courseId
        );

        openCourseModal(course);
    } catch (error) {
        showError("Não foi possível carregar o curso.", error);
    }
}
// =====================================================
// GUARDAR CURSO
// =====================================================

async function saveCourse(event) {

    event.preventDefault();

    const courseId =
        document.getElementById("courseId").value;

    const titulo =
        document.getElementById("courseTitle").value.trim();

    const descricao =
        document.getElementById("courseDescription").value.trim();

    const imagem =
        document.getElementById("courseImage").value.trim();

    const publicado =
        document.getElementById("coursePublished").checked;


    // ==========================================
    // VALIDAR TÍTULO
    // ==========================================

    if (!titulo) {

        alert("Digite o título do curso.");

        return;
    }


    try {

        // ==========================================
        // EDITAR CURSO
        // ==========================================

        if (courseId) {

            // Buscar curso atual
            const currentCourse =
                await databases.getDocument(
                    DATABASE_ID,
                    COURSES_COLLECTION_ID,
                    courseId
                );


            const payload = {

                titulo: titulo,

                descricao: descricao,

                imagem: imagem,

                publicado: publicado,

                // manter a ordem existente
                ordem: Number(currentCourse.ordem || 1)
            };


            await databases.updateDocument(

                DATABASE_ID,

                COURSES_COLLECTION_ID,

                courseId,

                payload

            );


            console.log(
                "✅ Curso atualizado."
            );


        }

        // ==========================================
        // NOVO CURSO
        // ==========================================

        else {

            // Buscar cursos existentes
            const result =
                await databases.listDocuments(

                    DATABASE_ID,

                    COURSES_COLLECTION_ID,

                    [
                        Appwrite.Query.limit(100)
                    ]

                );


            const existingCourses =
                result.documents || [];


            // Descobrir a próxima ordem
            let maiorOrdem = 0;


            existingCourses.forEach(
                course => {

                    const ordem =
                        Number(course.ordem || 0);


                    if (ordem > maiorOrdem) {

                        maiorOrdem = ordem;

                    }

                }
            );


            const novaOrdem =
                maiorOrdem + 1;


            console.log(
                "📌 Nova ordem do curso:",
                novaOrdem
            );


            const payload = {

                titulo: titulo,

                descricao: descricao,

                imagem: imagem,

                publicado: publicado,

                ordem: novaOrdem

            };


            await databases.createDocument(

                DATABASE_ID,

                COURSES_COLLECTION_ID,

                Appwrite.ID.unique(),

                payload

            );


            console.log(
                "✅ Curso criado."
            );

        }


        // ==========================================
        // FINALIZAR
        // ==========================================

        closeCourseModal();

        await loadCourses();


        alert(
            "Curso guardado com sucesso."
        );


    } catch (error) {

        console.error(
            "❌ Erro ao guardar curso:",
            error
        );


        alert(

            "Não foi possível guardar o curso.\n\n" +

            (
                error.message ||
                "Erro desconhecido."
            )

        );

    }

}
async function loadCertificateRequests() {

    const container = document.getElementById("certificateRequestsList");

    if (!container) return;

    container.innerHTML = `
        <div class="loading-message">
            A carregar pedidos de certificados...
        </div>
    `;

    try {

        const result = await databases.listDocuments(
            DATABASE_ID,
            "certificate_requests",
            [
                Appwrite.Query.orderDesc("data_pedido"),
                Appwrite.Query.limit(100)
            ]
        );

        const requests = result.documents || [];

        // ==========================================
        // ATUALIZAR CONTADORES
        // ==========================================

        updateCertificateCounters(requests);

        // ==========================================
        // NENHUM PEDIDO
        // ==========================================

        if (requests.length === 0) {

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-icon">
                        🎓
                    </div>

                    <h3>
                        Nenhum pedido de certificado
                    </h3>

                    <p>
                        Quando um aluno solicitar um certificado,
                        o pedido aparecerá aqui.
                    </p>

                </div>
            `;

            return;
        }

        // ==========================================
        // RENDERIZAR PEDIDOS
        // ==========================================

        container.innerHTML = requests.map(request => {

            const status =
                request.estado || "pendente";

            let statusClass = "pending";
            let statusText = "Pendente";

            if (status === "aprovado") {
                statusClass = "approved";
                statusText = "Aprovado";
            }

            if (status === "rejeitado") {
                statusClass = "rejected";
                statusText = "Rejeitado";
            }

            // ======================================
            // FORMATAR DATA
            // ======================================

            let formattedDate = "Não informado";

            if (request.data_pedido) {

                const date =
                    new Date(request.data_pedido);

                formattedDate =
                    date.toLocaleString("pt-PT", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    });
            }

            return `
                <div class="certificate-admin-card">

                    <!-- ============================== -->
                    <!-- CABEÇALHO -->
                    <!-- ============================== -->

                    <div class="certificate-admin-header">

                        <div class="certificate-admin-title">

                            <div class="certificate-admin-icon">
                                🎓
                            </div>

                            <div>

                                <h3>
                                    ${escapeHtml(
                                        request.nome_aluno ||
                                        "Aluno sem nome"
                                    )}
                                </h3>

                                <span>
                                    ${escapeHtml(
                                        request.curso ||
                                        "Curso não informado"
                                    )}
                                </span>

                            </div>

                        </div>

                        <div class="
                            certificate-status
                            ${statusClass}
                        ">
                            ${statusText}
                        </div>

                    </div>

                    <!-- ============================== -->
                    <!-- DADOS DO ALUNO -->
                    <!-- ============================== -->

                    <div class="certificate-admin-data">

                        <div class="certificate-data-item">

                            <span class="data-label">
                                👤 Nome
                            </span>

                            <strong>
                                ${escapeHtml(
                                    request.nome_aluno ||
                                    "Não informado"
                                )}
                            </strong>

                        </div>

                        <div class="certificate-data-item">

                            <span class="data-label">
                                📧 E-mail
                            </span>

                            <strong>
                                ${escapeHtml(
                                    request.email_aluno ||
                                    "Não informado"
                                )}
                            </strong>

                        </div>

                        <div class="certificate-data-item">

                            <span class="data-label">
                                🎓 Curso
                            </span>

                            <strong>
                                ${escapeHtml(
                                    request.curso ||
                                    "Não informado"
                                )}
                            </strong>

                        </div>

                        <div class="certificate-data-item">

                            <span class="data-label">
                                📅 Data do pedido
                            </span>

                            <strong>
                                ${formattedDate}
                            </strong>

                        </div>

                        <div class="certificate-data-item">

                            <span class="data-label">
                                🆔 ID do aluno
                            </span>

                            <strong class="id-value">
                                ${escapeHtml(
                                    request.student_id ||
                                    "Não informado"
                                )}
                            </strong>

                        </div>

                        <div class="certificate-data-item">

                            <span class="data-label">
                                🆔 ID do curso
                            </span>

                            <strong class="id-value">
                                ${escapeHtml(
                                    request.course_id ||
                                    "Não informado"
                                )}
                            </strong>

                        </div>

                    </div>

                    <!-- ============================== -->
                    <!-- AÇÕES -->
                    <!-- ============================== -->

                    <div class="certificate-admin-actions">

                        ${
                            status === "pendente"
                            ? `
                                <button
                                    class="admin-action-button approve-certificate"
                                    data-id="${request.$id}"
                                >
                                    ✓ Aprovar
                                </button>

                                <button
                                    class="admin-action-button reject-certificate"
                                    data-id="${request.$id}"
                                >
                                    ✕ Rejeitar
                                </button>
                            `
                            : ""
                        }

                        ${
                            status === "aprovado"
                            ? `
                                <button
                                    class="admin-action-button"
                                    disabled
                                >
                                    ✓ Certificado aprovado
                                </button>
                            `
                            : ""
                        }

                        ${
                            status === "rejeitado"
                            ? `
                                <button
                                    class="admin-action-button"
                                    disabled
                                >
                                    ✕ Pedido rejeitado
                                </button>
                            `
                            : ""
                        }

                    </div>

                </div>
            `;

        }).join("");

        // ==========================================
        // LIGAR BOTÕES
        // ==========================================

        attachCertificateActions();

    } catch (error) {

        console.error(
            "❌ Erro ao carregar pedidos:",
            error
        );

        container.innerHTML = `
            <div class="error-state">

                <div class="error-icon">
                    ⚠️
                </div>

                <h3>
                    Erro ao carregar pedidos
                </h3>

                <p>
                    Não foi possível carregar os dados
                    dos alunos.
                </p>

            </div>
        `;
    }
}
function updateCertificateCounters(requests) {

    const pending = requests.filter(
        request => request.estado === "pendente"
    ).length;

    const approved = requests.filter(
        request => request.estado === "aprovado"
    ).length;

    const rejected = requests.filter(
        request => request.estado === "rejeitado"
    ).length;

    const pendingElement =
        document.getElementById("pendingCertificatesCount");

    const approvedElement =
        document.getElementById("approvedCertificatesCount");

    const rejectedElement =
        document.getElementById("rejectedCertificatesCount");

    if (pendingElement) {
        pendingElement.textContent = pending;
    }

    if (approvedElement) {
        approvedElement.textContent = approved;
    }

    if (rejectedElement) {
        rejectedElement.textContent = rejected;
    }
}
async function updateCertificateStatus(requestId, status) {

    if (!requestId) return;

    try {

        await databases.updateDocument(
            DATABASE_ID,
            "certificate_requests",
            requestId,
            {
                estado: status
            }
        );

        await loadCertificateRequests();

    } catch (error) {

        console.error(
            "❌ Erro ao atualizar certificado:",
            error
        );

        alert(
            "Não foi possível atualizar o pedido.\n\n" +
            (error.message || "Erro desconhecido.")
        );
    }
}
function attachCertificateActions() {

    document
        .querySelectorAll(".approve-certificate")
        .forEach(button => {

            button.addEventListener("click", async () => {

                const confirmed = confirm(
                    "Deseja aprovar este pedido de certificado?"
                );

                if (!confirmed) return;

                await updateCertificateStatus(
                    button.dataset.id,
                    "aprovado"
                );
            });
        });


    document
        .querySelectorAll(".reject-certificate")
        .forEach(button => {

            button.addEventListener("click", async () => {

                const confirmed = confirm(
                    "Deseja rejeitar este pedido de certificado?"
                );

                if (!confirmed) return;

                await updateCertificateStatus(
                    button.dataset.id,
                    "rejeitado"
                );
            });
        });
}
async function deleteCourse(courseId) {
    if (!confirm("Eliminar este curso?")) return;

    try {
        const modules = await databases.listDocuments(
            DATABASE_ID,
            MODULES_COLLECTION_ID,
            [
                Appwrite.Query.equal("course_id", courseId),
                Appwrite.Query.limit(100)
            ]
        );

        if (modules.documents.length) {
            alert(
                "Este curso possui módulos.\n\n" +
                "Elimine primeiro os módulos e as aulas desse curso."
            );
            return;
        }

        await databases.deleteDocument(
            DATABASE_ID,
            COURSES_COLLECTION_ID,
            courseId
        );

        await loadCourses();
        alert("Curso eliminado com sucesso.");
    } catch (error) {
        showError("Não foi possível eliminar o curso.", error);
    }
}

// =====================================================
// MÓDULOS
// =====================================================

async function loadModules(courseId) {
    const list = document.getElementById("modulesList");
    const lessonSelect = document.getElementById("lessonModuleSelect");

    if (!courseId) {
        currentModules = [];

        if (list) {
            list.innerHTML = `
                <div class="empty-message">
                    Selecione um curso para ver os módulos.
                </div>
            `;
        }

        if (lessonSelect) {
            lessonSelect.innerHTML = `
                <option value="">Selecione um módulo</option>
            `;
        }

        document.getElementById("lessonsList").innerHTML = `
            <div class="empty-message">
                Selecione um módulo para ver as aulas.
            </div>
        `;

        return;
    }

    try {
        const result = await databases.listDocuments(
            DATABASE_ID,
            MODULES_COLLECTION_ID,
            [
                Appwrite.Query.equal("course_id", courseId),
                Appwrite.Query.orderAsc("ordem"),
                Appwrite.Query.limit(100)
            ]
        );

        currentModules = result.documents;

        renderModules(currentModules);
        populateModuleSelect(currentModules);
    } catch (error) {
        showError("Não foi possível carregar os módulos.", error);
        list.innerHTML = `
            <div class="empty-message">
                Não foi possível carregar os módulos.
            </div>
        `;
    }
}

function renderModules(modules) {
    const container = document.getElementById("modulesList");

    if (!modules.length) {
        container.innerHTML = `
            <div class="empty-message">
                Ainda não existem módulos neste curso.
            </div>
        `;
        return;
    }

    container.innerHTML = modules.map(module => `
        <article class="item-card">
            <div class="item-info">
                <div class="admin-item-topline">
                    <h3>${escapeHtml(module.titulo)}</h3>
                    <span class="order-badge">Ordem ${module.ordem ?? 1}</span>
                </div>

                <p>Módulo do curso selecionado.</p>

                <small class="admin-id">
                    ID: ${escapeHtml(module.$id)}
                </small>
            </div>

            <div class="item-actions">
                <button
                    type="button"
                    class="small-button edit-button"
                    onclick="editModule('${module.$id}')">
                    Editar
                </button>

                <button
                    type="button"
                    class="small-button delete-button"
                    onclick="deleteModule('${module.$id}')">
                    Eliminar
                </button>
            </div>
        </article>
    `).join("");
}

function populateModuleSelect(modules) {
    const select = document.getElementById("lessonModuleSelect");
    if (!select) return;

    select.innerHTML = `
        <option value="">Selecione um módulo</option>
        ${modules.map(module => `
            <option value="${escapeHtml(module.$id)}">
                ${escapeHtml(module.titulo)}
            </option>
        `).join("")}
    `;
}

function openModuleModal(module = null) {
    const courseSelect = document.getElementById("moduleCourse");
    const selectedCourse = document.getElementById("moduleCourseSelect").value;

    courseSelect.innerHTML = `
        <option value="">Selecione um curso</option>
        ${courses.map(course => `
            <option value="${escapeHtml(course.$id)}">
                ${escapeHtml(course.titulo)}
            </option>
        `).join("")}
    `;

    document.getElementById("moduleModalTitle").textContent =
        module ? "Editar módulo" : "Novo módulo";

    document.getElementById("moduleId").value =
        module?.$id || "";

    document.getElementById("moduleCourse").value =
        module?.course_id || selectedCourse || "";

    document.getElementById("moduleTitle").value =
        module?.titulo || "";

    document.getElementById("moduleOrder").value =
        module?.ordem || 1;

    document.getElementById("moduleModal").classList.add("active");
}

function closeModuleModal() {
    document.getElementById("moduleModal")?.classList.remove("active");
}

async function saveModule(event) {
    event.preventDefault();

    const id = document.getElementById("moduleId").value;
    const courseId = document.getElementById("moduleCourse").value;
    const titulo = document.getElementById("moduleTitle").value.trim();
    const ordem = Number(document.getElementById("moduleOrder").value);

    if (!courseId) {
        alert("Selecione um curso.");
        return;
    }

    if (!titulo) {
        alert("Digite o nome do módulo.");
        return;
    }

    if (!Number.isInteger(ordem) || ordem < 1) {
        alert("A ordem deve ser um número inteiro maior que zero.");
        return;
    }

    const payload = {
        course_id: courseId,
        titulo,
        ordem
    };

    try {
        if (id) {
            await databases.updateDocument(
                DATABASE_ID,
                MODULES_COLLECTION_ID,
                id,
                payload
            );
        } else {
            await databases.createDocument(
                DATABASE_ID,
                MODULES_COLLECTION_ID,
                Appwrite.ID.unique(),
                payload
            );
        }

        closeModuleModal();

        document.getElementById("moduleCourseSelect").value = courseId;
        await loadModules(courseId);

        alert(id
            ? "Módulo atualizado com sucesso."
            : "Módulo criado com sucesso."
        );
    } catch (error) {
        showError("Não foi possível guardar o módulo.", error);
    }
}

async function editModule(moduleId) {
    try {
        const module = await databases.getDocument(
            DATABASE_ID,
            MODULES_COLLECTION_ID,
            moduleId
        );

        openModuleModal(module);
    } catch (error) {
        showError("Não foi possível carregar o módulo.", error);
    }
}

async function deleteModule(moduleId) {
    if (!confirm("Eliminar este módulo?")) return;

    try {
        const lessons = await databases.listDocuments(
            DATABASE_ID,
            LESSONS_COLLECTION_ID,
            [
                Appwrite.Query.equal("module_id", moduleId),
                Appwrite.Query.limit(100)
            ]
        );

        if (lessons.documents.length) {
            alert(
                "Este módulo possui aulas.\n\n" +
                "Elimine primeiro as aulas deste módulo."
            );
            return;
        }

        const module = await databases.getDocument(
            DATABASE_ID,
            MODULES_COLLECTION_ID,
            moduleId
        );

        await databases.deleteDocument(
            DATABASE_ID,
            MODULES_COLLECTION_ID,
            moduleId
        );

        document.getElementById("moduleCourseSelect").value = module.course_id;
        await loadModules(module.course_id);

        alert("Módulo eliminado com sucesso.");
    } catch (error) {
        showError("Não foi possível eliminar o módulo.", error);
    }
}

// =====================================================
// AULAS
// =====================================================

async function loadLessons(moduleId) {
    const list = document.getElementById("lessonsList");

    if (!moduleId) {
        list.innerHTML = `
            <div class="empty-message">
                Selecione um módulo para ver as aulas.
            </div>
        `;
        return;
    }

    try {
        const result = await databases.listDocuments(
            DATABASE_ID,
            LESSONS_COLLECTION_ID,
            [
                Appwrite.Query.equal("module_id", moduleId),
                Appwrite.Query.orderAsc("ordem"),
                Appwrite.Query.limit(100)
            ]
        );

        renderLessons(result.documents);
    } catch (error) {
        showError("Não foi possível carregar as aulas.", error);
        list.innerHTML = `
            <div class="empty-message">
                Não foi possível carregar as aulas.
            </div>
        `;
    }
}

function renderLessons(lessons) {
    const list = document.getElementById("lessonsList");

    if (!lessons.length) {
        list.innerHTML = `
            <div class="empty-message">
                Este módulo ainda não possui aulas.
            </div>
        `;
        return;
    }

    list.innerHTML = lessons.map(lesson => {
        const published = lesson.publicado !== false;
        const hasYoutube = !!youtubeVideoId(lesson.video_url);

        return `
            <article class="item-card lesson-admin-card">
                <div class="item-info">
                    <div class="admin-item-topline">
                        <h3>${escapeHtml(lesson.titulo)}</h3>

                        <span class="status-badge ${published ? "published" : "draft"}">
                            ${published ? "Publicado" : "Rascunho"}
                        </span>
                    </div>

                    <p>
                        ${escapeHtml(
                            lesson.descricao ||
                            "Sem descrição."
                        )}
                    </p>

                    <div class="lesson-meta">
                        <span>Ordem ${lesson.ordem ?? 1}</span>
                        <span>${hasYoutube ? "▶ YouTube configurado" : "⚠ Sem vídeo"}</span>
                    </div>

                    <small class="admin-id">
                        ID: ${escapeHtml(lesson.$id)}
                    </small>
                </div>

                <div class="item-actions">
                    <button
                        type="button"
                        class="small-button edit-button"
                        onclick="editLesson('${lesson.$id}')">
                        Editar
                    </button>

                    <button
                        type="button"
                        class="small-button delete-button"
                        onclick="deleteLesson('${lesson.$id}')">
                        Eliminar
                    </button>
                </div>
            </article>
        `;
    }).join("");
}

function openLessonModal(lesson = null) {
    const moduleSelect = document.getElementById("lessonModule");

    moduleSelect.innerHTML = `
        <option value="">Selecione um módulo</option>
        ${currentModules.map(module => `
            <option value="${escapeHtml(module.$id)}">
                ${escapeHtml(module.titulo)}
            </option>
        `).join("")}
    `;

    const selectedModule =
        document.getElementById("lessonModuleSelect").value;

    document.getElementById("lessonModalTitle").textContent =
        lesson ? "Editar aula" : "Nova aula";

    document.getElementById("lessonId").value =
        lesson?.$id || "";

    document.getElementById("lessonModule").value =
        lesson?.module_id || selectedModule || "";

    document.getElementById("lessonTitle").value =
        lesson?.titulo || "";

    document.getElementById("lessonDescription").value =
        lesson?.descricao || "";

    document.getElementById("lessonVideoUrl").value =
        lesson?.video_url || "";

    document.getElementById("lessonOrder").value =
        lesson?.ordem || 1;

    document.getElementById("lessonPublished").checked =
        lesson?.publicado !== false;

    document.getElementById("lessonContent").value =
        lesson?.conteudo || "";

    setVideoPreview(lesson?.video_url || "");

    document.getElementById("lessonModal").classList.add("active");
}

function closeLessonModal() {
    document.getElementById("lessonModal")?.classList.remove("active");
}

async function editLesson(lessonId) {
    try {
        const lesson = await databases.getDocument(
            DATABASE_ID,
            LESSONS_COLLECTION_ID,
            lessonId
        );

        openLessonModal(lesson);
    } catch (error) {
        showError("Não foi possível carregar a aula.", error);
    }
}

async function saveLesson(event) {
    event.preventDefault();

    const id = document.getElementById("lessonId").value;
    const moduleId = document.getElementById("lessonModule").value;
    const titulo = document.getElementById("lessonTitle").value.trim();
    const descricao = document.getElementById("lessonDescription").value.trim();
    const videoUrl = document.getElementById("lessonVideoUrl").value.trim();
    const ordem = Number(document.getElementById("lessonOrder").value);
    const publicado = document.getElementById("lessonPublished").checked;
    const conteudo = document.getElementById("lessonContent").value.trim();

    if (!moduleId) {
        alert("Selecione um módulo.");
        return;
    }

    if (!titulo) {
        alert("Digite o título da aula.");
        return;
    }

    if (!Number.isInteger(ordem) || ordem < 1) {
        alert("A ordem deve ser um número inteiro maior que zero.");
        return;
    }

    if (videoUrl && !youtubeVideoId(videoUrl)) {
        alert(
            "O link do vídeo não parece ser do YouTube.\n\n" +
            "Use, por exemplo:\n" +
            "https://www.youtube.com/watch?v=...\n" +
            "https://youtu.be/..."
        );
        return;
    }

    const payload = {
        module_id: moduleId,
        titulo,
        descricao,
        conteudo,
        video_url: videoUrl,
        ordem,
        publicado
    };

    try {
        if (id) {
            await databases.updateDocument(
                DATABASE_ID,
                LESSONS_COLLECTION_ID,
                id,
                payload
            );
        } else {
            await databases.createDocument(
                DATABASE_ID,
                LESSONS_COLLECTION_ID,
                Appwrite.ID.unique(),
                payload
            );
        }

        closeLessonModal();

        document.getElementById("lessonModuleSelect").value = moduleId;
        await loadLessons(moduleId);

        alert(id
            ? "Aula atualizada com sucesso."
            : "Aula criada com sucesso."
        );
    } catch (error) {
        showError("Não foi possível guardar a aula.", error);
    }
}

async function deleteLesson(lessonId) {
    if (!confirm("Eliminar esta aula?")) return;

    try {
        const lesson = await databases.getDocument(
            DATABASE_ID,
            LESSONS_COLLECTION_ID,
            lessonId
        );

        await databases.deleteDocument(
            DATABASE_ID,
            LESSONS_COLLECTION_ID,
            lessonId
        );

        document.getElementById("lessonModuleSelect").value =
            lesson.module_id;

        await loadLessons(lesson.module_id);

        alert("Aula eliminada com sucesso.");
    } catch (error) {
        showError("Não foi possível eliminar a aula.", error);
    }
}

// =====================================================
// EVENTOS
// =====================================================

document.getElementById("newCourseBtn")
    ?.addEventListener("click", () => openCourseModal());

document.getElementById("closeCourseModal")
    ?.addEventListener("click", closeCourseModal);

document.getElementById("cancelCourseBtn")
    ?.addEventListener("click", closeCourseModal);

document.getElementById("courseForm")
    ?.addEventListener("submit", saveCourse);

document.getElementById("moduleCourseSelect")
    ?.addEventListener("change", event => {
        loadModules(event.target.value);
    });

document.getElementById("newModuleBtn")
    ?.addEventListener("click", () => {
        if (!document.getElementById("moduleCourseSelect").value) {
            alert("Primeiro selecione um curso.");
            return;
        }

        openModuleModal();
    });

document.getElementById("closeModuleModal")
    ?.addEventListener("click", closeModuleModal);

document.getElementById("cancelModuleBtn")
    ?.addEventListener("click", closeModuleModal);

document.getElementById("moduleForm")
    ?.addEventListener("submit", saveModule);

document.getElementById("lessonModuleSelect")
    ?.addEventListener("change", event => {
        loadLessons(event.target.value);
    });

document.getElementById("newLessonBtn")
    ?.addEventListener("click", () => {
        if (!document.getElementById("lessonModuleSelect").value) {
            alert("Primeiro selecione um módulo.");
            return;
        }

        openLessonModal();
    });

document.getElementById("closeLessonModal")
    ?.addEventListener("click", closeLessonModal);

document.getElementById("cancelLessonBtn")
    ?.addEventListener("click", closeLessonModal);

document.getElementById("lessonForm")
    ?.addEventListener("submit", saveLesson);

document.getElementById("lessonVideoUrl")
    ?.addEventListener("input", event => {
        setVideoPreview(event.target.value);
    });

document.querySelectorAll(".modal")
    .forEach(modal => {
        modal.addEventListener("click", event => {
            if (event.target === modal) {
                modal.classList.remove("active");
            }
        });
    });

document.getElementById("logoutBtn")
    ?.addEventListener("click", async () => {
        try {
            await account.deleteSession("current");
        } catch (error) {
            console.warn("⚠️ Erro ao terminar sessão:", error);
        } finally {
            window.location.href = "../login.html";
        }
    });
/* =========================================================
   PERCURSO DOS ALUNOS
   ========================================================= */


/* =========================================================
   VARIÁVEIS
   ========================================================= */

let allStudentsData = [];


/* =========================================================
   CARREGAR ALUNOS
   ========================================================= */

async function loadStudents() {

    const container =
        document.getElementById("studentsList");

    if (!container) return;

    container.innerHTML = `
        <div class="loading">
            A carregar percurso dos alunos...
        </div>
    `;

    try {

        /* =========================================
           1. BUSCAR PERFIS
        ========================================= */

        const profilesResult =
            await databases.listDocuments(
                DATABASE_ID,
                "profiles",
                [
                    Appwrite.Query.limit(100)
                ]
            );

        const profiles =
            profilesResult.documents || [];


        /* =========================================
           2. BUSCAR MATRÍCULAS
        ========================================= */

        const enrollmentsResult =
            await databases.listDocuments(
                DATABASE_ID,
                "enrollments",
                [
                    Appwrite.Query.limit(100)
                ]
            );

        const enrollments =
            enrollmentsResult.documents || [];


        /* =========================================
           3. BUSCAR CURSOS
        ========================================= */

        const coursesResult =
            await databases.listDocuments(
                DATABASE_ID,
                "courses",
                [
                    Appwrite.Query.limit(100)
                ]
            );

        const courses =
            coursesResult.documents || [];


        /* =========================================
           4. BUSCAR MÓDULOS
        ========================================= */

        const modulesResult =
            await databases.listDocuments(
                DATABASE_ID,
                "modules",
                [
                    Appwrite.Query.limit(100)
                ]
            );

        const modules =
            modulesResult.documents || [];


        /* =========================================
           5. BUSCAR AULAS PUBLICADAS
        ========================================= */

        const lessonsResult =
            await databases.listDocuments(
                DATABASE_ID,
                "lessons",
                [
                    Appwrite.Query.equal(
                        "publicado",
                        true
                    ),
                    Appwrite.Query.limit(100)
                ]
            );

        const lessons =
            lessonsResult.documents || [];


        /* =========================================
           6. BUSCAR PROGRESSO
        ========================================= */

        const progressResult =
            await databases.listDocuments(
                DATABASE_ID,
                "progress",
                [
                    Appwrite.Query.limit(100)
                ]
            );

        const progressDocuments =
            progressResult.documents || [];


        /* =========================================
           CRIAR MAPA DE CURSOS
        ========================================= */

        const coursesMap =
            new Map(
                courses.map(course => [
                    course.$id,
                    course
                ])
            );


        /* =========================================
           CONSTRUIR PERCURSO
        ========================================= */

        allStudentsData =
            profiles.map(profile => {

                const studentId =
                    profile.user_id ||
                    profile.student_id ||
                    profile.$id;


                const studentEnrollments =
                    enrollments.filter(
                        enrollment =>
                            enrollment.student_id === studentId
                    );


                const studentProgress =
                    progressDocuments.filter(
                        item =>
                            item.student_id === studentId
                    );


                const studentCourses =
                    studentEnrollments.map(
                        enrollment => {

                            const course =
                                coursesMap.get(
                                    enrollment.course_id
                                );

                            if (!course) {
                                return null;
                            }


                            /* =========================
                               MÓDULOS DO CURSO
                            ========================= */

                            const courseModules =
                                modules.filter(
                                    module =>
                                        module.course_id ===
                                        course.$id
                                );


                            const moduleIds =
                                courseModules.map(
                                    module =>
                                        module.$id
                                );


                            /* =========================
                               AULAS DO CURSO
                            ========================= */

                            const courseLessons =
                                lessons.filter(
                                    lesson =>
                                        moduleIds.includes(
                                            lesson.module_id
                                        )
                                );


                            const totalLessons =
                                courseLessons.length;


                            /* =========================
                               PROGRESSO
                            ========================= */

                            const completedLessons =
                                studentProgress.filter(
                                    item =>
                                        item.course_id ===
                                        course.$id &&
                                        item.completed === true
                                ).length;


                            let percentage = 0;


                            if (totalLessons > 0) {

                                percentage =
                                    Math.round(
                                        (
                                            completedLessons /
                                            totalLessons
                                        ) * 100
                                    );

                            }


                            const completed =
                                totalLessons > 0 &&
                                completedLessons >= totalLessons;


                            return {

                                courseId:
                                    course.$id,

                                courseTitle:
                                    course.titulo ||
                                    "Curso",

                                totalLessons,

                                completedLessons,

                                percentage,

                                completed

                            };

                        }
                    ).filter(Boolean);


                return {

                    id:
                        studentId,

                    name:
                        profile.nome ||
                        profile.name ||
                        profile.nome_completo ||
                        "Aluno",

                    email:
                        profile.email ||
                        "E-mail não informado",

                    courses:
                        studentCourses

                };

            });


        /* =========================================
           ATUALIZAR ESTATÍSTICAS
        ========================================= */

        updateStudentStatistics();


        /* =========================================
           RENDERIZAR
        ========================================= */

        renderStudents();


    } catch (error) {

        console.error(
            "❌ Erro ao carregar alunos:",
            error
        );

        container.innerHTML = `
            <div class="error-state">

                <div class="error-icon">
                    ⚠️
                </div>

                <h3>
                    Não foi possível carregar os alunos
                </h3>

                <p>
                    Verifique as coleções e tente novamente.
                </p>

            </div>
        `;

    }

}
function updateStudentStatistics() {

    const totalElement =
        document.getElementById(
            "totalStudentsCount"
        );

    const activeElement =
        document.getElementById(
            "activeStudentsCount"
        );

    const completedElement =
        document.getElementById(
            "completedStudentsCount"
        );


    if (!totalElement) return;


    const totalStudents =
        allStudentsData.length;


    const activeStudents =
        allStudentsData.filter(student =>
            student.courses.some(
                course =>
                    course.percentage > 0 &&
                    !course.completed
            )
        ).length;


    const completedCourses =
        allStudentsData.reduce(
            (total, student) => {

                return total +
                    student.courses.filter(
                        course =>
                            course.completed
                    ).length;

            },
            0
        );


    totalElement.textContent =
        totalStudents;

    activeElement.textContent =
        activeStudents;

    completedElement.textContent =
        completedCourses;

}

function renderStudents() {

    const container =
        document.getElementById("studentsList");

    if (!container) return;


    const searchInput =
        document.getElementById(
            "studentSearch"
        );

    const statusFilter =
        document.getElementById(
            "studentStatusFilter"
        );


    const search =
        (
            searchInput?.value || ""
        ).toLowerCase().trim();


    const status =
        statusFilter?.value || "todos";


    const filtered =
        allStudentsData.filter(student => {


            /* =========================
               PESQUISA
            ========================= */

            const matchesSearch =
                !search ||
                student.name
                    .toLowerCase()
                    .includes(search) ||
                student.email
                    .toLowerCase()
                    .includes(search);


            if (!matchesSearch) {
                return false;
            }


            /* =========================
               FILTRO
            ========================= */

            if (status === "andamento") {

                return student.courses.some(
                    course =>
                        course.percentage > 0 &&
                        !course.completed
                );

            }


            if (status === "concluido") {

                return student.courses.some(
                    course =>
                        course.completed
                );

            }


            return true;

        });


    /* =========================
       NENHUM RESULTADO
    ========================= */

    if (filtered.length === 0) {

        container.innerHTML = `
            <div class="students-empty">

                <div>
                    👥
                </div>

                <h3>
                    Nenhum aluno encontrado
                </h3>

                <p>
                    Não existem alunos correspondentes
                    aos filtros selecionados.
                </p>

            </div>
        `;

        return;
    }


    /* =========================
       RENDERIZAR
    ========================= */

    container.innerHTML =
        filtered.map(student => {


            const courses =
                student.courses;


            return `
                <article
                    class="student-admin-card"
                >

                    <div
                        class="student-admin-header"
                    >

                        <div
                            class="student-avatar"
                        >
                            ${getStudentInitial(
                                student.name
                            )}
                        </div>


                        <div
                            class="student-admin-info"
                        >

                            <h3>
                                ${escapeHtml(
                                    student.name
                                )}
                            </h3>

                            <p>
                                ${escapeHtml(
                                    student.email
                                )}
                            </p>

                        </div>

                    </div>


                    <div
                        class="student-courses"
                    >

                        ${
                            courses.length === 0

                            ? `
                                <div
                                    class="student-no-course"
                                >
                                    Ainda não possui
                                    nenhuma formação.
                                </div>
                            `

                            :

                            courses.map(course => {

                                return `
                                    <div
                                        class="
                                            student-course-progress
                                        "
                                    >

                                        <div
                                            class="
                                                student-course-top
                                            "
                                        >

                                            <strong>
                                                ${escapeHtml(
                                                    course.courseTitle
                                                )}
                                            </strong>

                                            <span
                                                class="
                                                    ${
                                                        course.completed
                                                        ? "course-completed"
                                                        : "course-progress"
                                                    }
                                                "
                                            >
                                                ${
                                                    course.completed
                                                    ? "✓ Concluído"
                                                    : course.percentage + "%"
                                                }
                                            </span>

                                        </div>


                                        <div
                                            class="
                                                student-progress-bar
                                            "
                                        >

                                            <div
                                                class="
                                                    student-progress-fill
                                                "
                                                style="
                                                    width:
                                                    ${course.percentage}%;
                                                "
                                            ></div>

                                        </div>


                                        <div
                                            class="
                                                student-course-bottom
                                            "
                                        >

                                            <span>
                                                ${
                                                    course.completedLessons
                                                }
                                                /
                                                ${
                                                    course.totalLessons
                                                }
                                                aulas concluídas
                                            </span>

                                            <span>
                                                ${
                                                    course.percentage
                                                }%
                                            </span>

                                        </div>

                                    </div>
                                `;

                            }).join("")
                        }

                    </div>

                </article>
            `;

        }).join("");

}
function getStudentInitial(name) {

    if (!name) {
        return "A";
    }

    return name
        .trim()
        .charAt(0)
        .toUpperCase();

}
function setupStudentsNavigation() {

    const button = document.getElementById("studentsBtn");

    const modal = document.getElementById("studentsModal");

    const closeButton =
        document.getElementById("closeStudentsBtn");

    const overlay =
        document.querySelector(".students-modal-overlay");


    if (!button || !modal || !closeButton) {
        console.warn("Elementos do popup de alunos não encontrados.");
        return;
    }


    // ABRIR

    button.addEventListener("click", () => {

        modal.classList.add("active");

        document.body.style.overflow = "hidden";

        // Atualiza os dados ao abrir
        loadStudents();

    });


    // FECHAR

    closeButton.addEventListener("click", closeStudentsModal);


    // Clicar no fundo também fecha

    if (overlay) {

        overlay.addEventListener(
            "click",
            closeStudentsModal
        );

    }


    // ESC fecha

    document.addEventListener("keydown", (event) => {

        if (
            event.key === "Escape" &&
            modal.classList.contains("active")
        ) {

            closeStudentsModal();

        }

    });

}


function closeStudentsModal() {

    const modal =
        document.getElementById("studentsModal");

    if (!modal) return;


    modal.classList.remove("active");

    document.body.style.overflow = "";

}
function setupStudentFilters() {

    const search =
        document.getElementById("studentSearch");

    const filter =
        document.getElementById("studentStatusFilter");

    const refresh =
        document.getElementById("refreshStudentsBtn");


    if (search) {

        search.addEventListener("input", () => {

            renderStudents();

        });

    }


    if (filter) {

        filter.addEventListener("change", () => {

            renderStudents();

        });

    }


    if (refresh) {

        refresh.addEventListener("click", async () => {

            refresh.innerHTML = "⏳ A atualizar...";

            await loadStudents();

            refresh.innerHTML = "↻ Atualizar";

        });

    }

}
// =====================================================
// INICIALIZAÇÃO
// =====================================================
async function startAdmin() {

    const user = await requireAdmin();

    if (!user) return;


    // ==============================
    // CARREGAR ÁREA ADMIN
    // ==============================

    await loadCourses();

    await loadCertificateRequests();


    // ==============================
    // CARREGAR ALUNOS
    // ==============================

    await loadStudents();


    // ==============================
    // EVENTOS
    // ==============================

    setupStudentsNavigation();

    setupStudentFilters();

}

startAdmin();