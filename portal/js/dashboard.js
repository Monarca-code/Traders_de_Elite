// =====================================================
// TRADERS DE ELITE — ÁREA DO ALUNO
// =====================================================

const STUDENT_SECTIONS = ["inicio", "cursos", "progresso", "perfil", "adicionar", "certificados"];

async function requireUser() {
    try {
        const user = await account.get();
        return user;
    } catch (_) {
        window.location.href = "login.html";
        return null;
    }
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[character]));
}

async function getStudentProfile(user) {
    try {
        const result = await databases.listDocuments(
            DATABASE_ID,
            PROFILES_COLLECTION_ID,
            [Appwrite.Query.equal("email", user.email), Appwrite.Query.limit(1)]
        );
        return result.documents[0] || null;
    } catch (error) {
        console.error("❌ Erro ao carregar perfil:", error);
        return null;
    }
}

async function getEnrollments(userId, profileId) {
    try {
        const result = await databases.listDocuments(
            DATABASE_ID,
            ENROLLMENTS_COLLECTION_ID,
            [Appwrite.Query.equal("student_id", userId), Appwrite.Query.limit(100)]
        );
        if (result.documents.length) return result.documents;
    } catch (error) {
        console.warn("⚠️ Inscrições pelo User ID falharam:", error);
    }

    if (profileId) {
        try {
            const result = await databases.listDocuments(
                DATABASE_ID,
                ENROLLMENTS_COLLECTION_ID,
                [Appwrite.Query.equal("student_id", profileId), Appwrite.Query.limit(100)]
            );
            if (result.documents.length) return result.documents;
        } catch (error) {
            console.warn("⚠️ Inscrições pelo Profile ID falharam:", error);
        }
    }

    return [];
}


async function getAllPublishedCourses() {
    try {
        const result = await databases.listDocuments(
            DATABASE_ID,
            COURSES_COLLECTION_ID,
            [
                Appwrite.Query.equal("publicado", true),
                Appwrite.Query.orderAsc("ordem"),
                Appwrite.Query.limit(100)
            ]
        );
        return result.documents;
    } catch (error) {
        console.error("❌ Erro ao carregar catálogo de cursos:", error);
        return [];
    }
}
async function enrollStudent(user, courseId) {
    if (!courseId) return;

    try {
        const profile = await getStudentProfile(user);
        const existing = await getEnrollments(user.$id, profile?.$id);

        if (existing.some(item => item.course_id === courseId)) {
            alert("Você já está inscrito neste curso.");
            switchSection("cursos");
            return;
        }

        const now = new Date().toISOString();

        await databases.createDocument(
            DATABASE_ID,
            ENROLLMENTS_COLLECTION_ID,
            Appwrite.ID.unique(),
            {
                student_id: user.$id,
                course_id: courseId,
                data_inscricao: now
            }
        );

        alert("Curso adicionado à sua área com sucesso.");

        await loadDashboard();

        switchSection("cursos");

    } catch (error) {
        console.error("❌ Erro ao adicionar curso:", error);

        alert(
            "Não foi possível adicionar o curso.\n\n" +
            (error.message || "Verifique as permissões da coleção enrollments.")
        );
    }
}
function renderAvailableCourses(courses, enrolledIds, user) {
    const container = document.getElementById("availableCourses");
    if (!container) return;

    const available = courses.filter(course => !enrolledIds.has(course.$id));

    if (!available.length) {
        container.innerHTML = `<div class="empty-panel"><div class="empty-icon">✓</div><h3>Está tudo em dia</h3><p>Não existem novos cursos disponíveis para adicionar neste momento.</p><button class="gold-action" data-go-section="cursos">Ver meus cursos</button></div>`;
        container.querySelector("[data-go-section]")?.addEventListener("click", () => switchSection("cursos"));
        return;
    }

    container.innerHTML = available.map(course => {
        const title = course.titulo || "Curso sem título";
        const description = course.descricao || "Formação da TRADERS DE ELITE.";
        const image = getCourseImage(course);
        return `
            <article class="course-item available-course-item">
                ${image ? `<div class="course-image"><img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy"></div>` : ""}
                <div class="course-content">
                    <h3>${escapeHtml(title)}</h3>
                    <p>${escapeHtml(description)}</p>
                    <button class="course-button add-course-button" data-course-id="${escapeHtml(course.$id)}">Adicionar curso +</button>
                </div>
            </article>
        `;
    }).join("");

    container.querySelectorAll(".add-course-button").forEach(button => {
        button.addEventListener("click", () => enrollStudent(user, button.dataset.courseId));
    });
}

async function saveProfile(user) {
    const profile = await getStudentProfile(user);
    const name = document.getElementById("editProfileName")?.value.trim();
    const phone = document.getElementById("editProfilePhone")?.value.trim();
    const message = document.getElementById("profileMessage");
    const button = document.getElementById("saveProfileBtn");

    if (!name) {
        if (message) message.textContent = "Digite o seu nome completo.";
        return;
    }

    if (!profile) {
        if (message) message.textContent = "O perfil do estudante não foi encontrado.";
        return;
    }

    button.disabled = true;
    button.textContent = "A guardar...";
    if (message) message.textContent = "A atualizar os seus dados...";

    try {
        await account.updateName(name);
        await databases.updateDocument(
            DATABASE_ID,
            PROFILES_COLLECTION_ID,
            profile.$id,
            {
                nome_completo: name,
                telefone: phone
            }
        );

        if (message) message.textContent = "Perfil atualizado com sucesso.";
        document.getElementById("profileEditPanel").hidden = true;
        const freshUser = await account.get();
        const freshProfile = await getStudentProfile(freshUser);
        renderStudentIdentity(freshUser, freshProfile);
    } catch (error) {
        console.error("❌ Erro ao atualizar perfil:", error);
        if (message) message.textContent = "Não foi possível atualizar o perfil: " + (error.message || "erro desconhecido.");
    } finally {
        button.disabled = false;
        button.textContent = "Guardar alterações";
    }
}

function openProfileEditor(user, profile) {
    const panel = document.getElementById("profileEditPanel");
    if (!panel) return;
    panel.hidden = false;
    document.getElementById("editProfileName").value = getDisplayName(user, profile);
    document.getElementById("editProfilePhone").value = profile?.telefone || "";
    document.getElementById("editProfileEmail").value = user.email || "";
    document.getElementById("profileMessage").textContent = "";
    document.getElementById("editProfileName").focus();
}

async function getCourse(courseId) {
    if (!courseId) return null;
    try {
        return await databases.getDocument(DATABASE_ID, COURSES_COLLECTION_ID, courseId);
    } catch (error) {
        console.error("❌ Erro ao carregar curso:", courseId, error);
        return null;
    }
}

async function getStudentProgress(userId) {
    try {
        const result = await databases.listDocuments(
            DATABASE_ID,
            PROGRESS_COLLECTION_ID,
            [Appwrite.Query.equal("student_id", userId), Appwrite.Query.limit(100)]
        );
        return result.documents;
    } catch (error) {
        console.error("❌ Erro ao carregar progresso:", error);
        return [];
    }
}

async function getCourseLessons(courseId) {
    let totalLessons = 0;
    try {
        const modulesResult = await databases.listDocuments(
            DATABASE_ID,
            MODULES_COLLECTION_ID,
            [Appwrite.Query.equal("course_id", courseId), Appwrite.Query.limit(100)]
        );

        for (const module of modulesResult.documents) {
            try {
                const lessonsResult = await databases.listDocuments(
                    DATABASE_ID,
                    LESSONS_COLLECTION_ID,
                    [
                        Appwrite.Query.equal("modulo_id", module.$id),
                        Appwrite.Query.equal("publicado", true),
                        Appwrite.Query.limit(100)
                    ]
                );
                totalLessons += lessonsResult.documents.length;
            } catch (error) {
                console.warn("⚠️ Erro ao carregar aulas:", module.$id, error);
            }
        }
    } catch (error) {
        console.error("❌ Erro ao carregar módulos:", courseId, error);
    }
    return totalLessons;
}

function getCourseImage(course) {
    return course.imagem || course.imagem_url || course.image || "";
}

function createCourseCard(course, progressData) {
    const courseId = course.$id;
    const title = course.titulo || course.nome || course.title || "Curso sem título";
    const description = course.descricao || course.resumo || course.description || "Curso de formação da comunidade.";
    const image = getCourseImage(course);
    const completed = progressData.completed;
    const total = progressData.total;
    const percentage = progressData.percentage;

    return `
        <article class="course-item">
            ${image ? `<div class="course-image"><img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy"></div>` : ""}
            <div class="course-content">
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(description)}</p>
                <div class="dashboard-progress">
                    <div class="dashboard-progress-info"><span>${completed} / ${total} aulas</span><strong>${percentage}%</strong></div>
                    <div class="dashboard-progress-bar"><div class="dashboard-progress-fill" style="width:${percentage}%"></div></div>
                </div>
                <a class="course-button" href="course.html?id=${encodeURIComponent(courseId)}">${percentage > 0 ? "Continuar curso" : "Começar curso"} →</a>
            </div>
        </article>
    `;
}

function renderCourses(courses, courseProgress) {
    const container = document.getElementById("courses");
    if (!container) return;

    if (!courses.length) {
        container.innerHTML = `<div class="empty-panel"><div class="empty-icon">▣</div><h3>Nenhum curso disponível</h3><p>Ainda não existem cursos atribuídos à sua conta.</p></div>`;
        return;
    }

    container.innerHTML = courses.map(course => createCourseCard(course, courseProgress[course.$id] || {total:0, completed:0, percentage:0})).join("");
}

function renderFeaturedCourses(courses, courseProgress) {
    const container = document.getElementById("featuredCourses");
    if (!container) return;

    if (!courses.length) {
        container.innerHTML = `<div class="empty-panel"><div class="empty-icon">▣</div><h3>A sua formação começa aqui</h3><p>Quando um curso for atribuído à sua conta, ele aparecerá nesta área.</p><button class="gold-action" data-go-section="cursos">Ver meus cursos</button></div>`;
        return;
    }

    const ordered = [...courses].sort((a,b) => (courseProgress[b.$id]?.percentage || 0) - (courseProgress[a.$id]?.percentage || 0));
    container.innerHTML = ordered.slice(0, 2).map(course => createCourseCard(course, courseProgress[course.$id] || {total:0, completed:0, percentage:0})).join("");
}

function renderProgress(courses, courseProgress) {
    const container = document.getElementById("progressCourses");
    if (!container) return;

    if (!courses.length) {
        container.innerHTML = `<div class="empty-panel"><div class="empty-icon">◔</div><h3>Sem progresso ainda</h3><p>Os seus dados de progresso aparecerão quando tiver cursos atribuídos.</p></div>`;
        return;
    }

    container.innerHTML = courses.map(course => {
        const data = courseProgress[course.$id] || {total:0, completed:0, percentage:0};
        return `
            <article class="progress-course-card">
                <div class="progress-course-top"><h3>${escapeHtml(course.titulo || "Curso")}</h3><span>${data.percentage}%</span></div>
                <div class="dashboard-progress-bar"><div class="dashboard-progress-fill" style="width:${data.percentage}%"></div></div>
                <div class="progress-course-meta"><span>${data.completed} de ${data.total} aulas concluídas</span><a href="course.html?id=${encodeURIComponent(course.$id)}" style="color:var(--gold)">Abrir curso →</a></div>
            </article>
        `;
    }).join("");
}

function updateCounters(courses, courseProgress) {
    const courseCount = document.getElementById("courseCount");
    const completedCount = document.getElementById("completedCount");
    const overallProgress = document.getElementById("overallProgress");

    let completedTotal = 0;
    let totalLessons = 0;

    courses.forEach(course => {
        const data = courseProgress[course.$id];
        if (!data) return;
        completedTotal += data.completed;
        totalLessons += data.total;
    });

    if (courseCount) courseCount.textContent = courses.length;
    if (completedCount) completedCount.textContent = completedTotal;
    if (overallProgress) overallProgress.textContent = totalLessons ? `${Math.round((completedTotal / totalLessons) * 100)}%` : "0%";
}

function getDisplayName(user, profile) {
    return profile?.nome_completo || profile?.nome || user.name || user.email?.split("@")[0] || "Estudante";
}

function renderStudentIdentity(user, profile) {
    const name = getDisplayName(user, profile);
    const initial = name.trim().charAt(0).toUpperCase() || "E";

    const studentName = document.getElementById("studentName");
    const topbarName = document.getElementById("topbarStudentName");
    const avatar = document.getElementById("studentAvatar");
    const profileAvatar = document.getElementById("profileAvatar");

    if (studentName) studentName.textContent = name;
    if (topbarName) topbarName.textContent = name;
    if (avatar) avatar.textContent = initial;
    if (profileAvatar) profileAvatar.textContent = initial;

    const set = (id, value, fallback = "—") => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || fallback;
    };

    set("profileName", profile?.nome_completo || name);
    set("profileEmail", user.email);
    set("profilePhone", profile?.telefone);
    set("profileType", profile?.tipo || "Estudante");
    set("profileStatus", profile?.estado || "ativo");

    const date = profile?.data_registro;
    set("profileDate", date ? new Date(date).toLocaleDateString("pt-PT") : "—");
}

function switchSection(sectionName) {
    if (!STUDENT_SECTIONS.includes(sectionName)) sectionName = "inicio";

    document.querySelectorAll(".student-nav-link").forEach(button => {
        button.classList.toggle("active", button.dataset.section === sectionName);
    });

    document.querySelectorAll(".student-section").forEach(section => {
        section.classList.toggle("active", section.dataset.page === sectionName);
    });

    if (window.innerWidth <= 850) closeSidebar();
    history.replaceState(null, "", `#${sectionName}`);
}

function openSidebar() {
    document.getElementById("studentSidebar")?.classList.add("open");
    document.getElementById("sidebarOverlay")?.classList.add("show");
}

function closeSidebar() {
    document.getElementById("studentSidebar")?.classList.remove("open");
    document.getElementById("sidebarOverlay")?.classList.remove("show");
}
async function requestCertificate(user, course) {
    if (!user || !course) return;

    try {
        // Verificar se já existe uma solicitação
        const existing = await databases.listDocuments(
            DATABASE_ID,
            "certificate_requests",
            [
                Appwrite.Query.equal("student_id", user.$id),
                Appwrite.Query.equal("course_id", course.$id),
                Appwrite.Query.limit(1)
            ]
        );

        if (existing.documents.length) {
            alert(
                "Você já possui uma solicitação de certificado para este curso."
            );
            return;
        }

        const now = new Date().toISOString();

        await databases.createDocument(
            DATABASE_ID,
            "certificate_requests",
            Appwrite.ID.unique(),
            {
                student_id: user.$id,
                course_id: course.$id,
                nome_aluno: user.name || user.email.split("@")[0],
                email_aluno: user.email,
                curso: course.titulo || "Curso",
                data_pedido: now,
                estado: "pendente"
            }
        );

        alert(
            "✅ Solicitação enviada com sucesso!\n\n" +
            "Os administradores irão analisar o seu pedido " +
            "e entrarão em contacto por e-mail."
        );

        await loadDashboard();

    } catch (error) {
        console.error(
            "❌ Erro ao solicitar certificado:",
            error
        );

        alert(
            "Não foi possível enviar a solicitação.\n\n" +
            (error.message || "Erro desconhecido.")
        );
    }
}
async function renderCertificateRequests(user, courses, courseProgress) {

    const container = document.getElementById("certificateCourses");

    if (!container) return;

    container.innerHTML = `
        <div class="loading-message">
            A carregar pedidos de certificados...
        </div>
    `;

    try {

        // ==========================================
        // BUSCAR PEDIDOS DE CERTIFICADOS DO ALUNO
        // ==========================================

        const result = await databases.listDocuments(
            DATABASE_ID,
            "certificate_requests",
            [
                Appwrite.Query.equal("student_id", user.$id),
                Appwrite.Query.limit(100)
            ]
        );

        const requests = result.documents || [];

        // ==========================================
        // ORGANIZAR PEDIDOS POR CURSO
        // ==========================================

        const requestsByCourse = new Map();

        requests.forEach(request => {

            const courseId = request.course_id;

            // Se houver mais de um pedido para o mesmo curso,
            // mantém o mais recente.
            if (!requestsByCourse.has(courseId)) {

                requestsByCourse.set(courseId, request);

            } else {

                const current = requestsByCourse.get(courseId);

                const currentDate =
                    new Date(current.data_pedido || 0).getTime();

                const newDate =
                    new Date(request.data_pedido || 0).getTime();

                if (newDate > currentDate) {
                    requestsByCourse.set(courseId, request);
                }
            }
        });

        // ==========================================
        // APENAS CURSOS CONCLUÍDOS
        // ==========================================

        const completedCourses = courses.filter(course => {

            const progress = courseProgress[course.$id];

            return (
                progress &&
                progress.total > 0 &&
                progress.completed >= progress.total
            );

        });

        // ==========================================
        // NENHUM CURSO CONCLUÍDO
        // ==========================================

        if (completedCourses.length === 0) {

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-icon">
                        🎓
                    </div>

                    <h3>Nenhum certificado disponível</h3>

                    <p>
                        Conclua uma formação para poder solicitar
                        o seu certificado.
                    </p>

                </div>
            `;

            return;
        }

        // ==========================================
        // RENDERIZAR CURSOS
        // ==========================================

        container.innerHTML = completedCourses.map(course => {

            const request = requestsByCourse.get(course.$id);

            const courseTitle =
                course.titulo || "Curso";

            // ======================================
            // SEM PEDIDO
            // ======================================

            if (!request) {

                return `
                    <div class="certificate-course-card">

                        <div class="certificate-course-info">

                            <div class="certificate-icon">
                                🎓
                            </div>

                            <div>

                                <h3>
                                    ${escapeHtml(courseTitle)}
                                </h3>

                                <p>
                                    Formação concluída com sucesso.
                                </p>

                            </div>

                        </div>

                        <button
                            class="gold-action certificate-request-button"
                            data-course-id="${course.$id}"
                        >
                            Solicitar certificado
                        </button>

                    </div>
                `;
            }

            // ======================================
            // PEDIDO PENDENTE
            // ======================================

            if (request.estado === "pendente") {

                return `
                    <div class="certificate-course-card">

                        <div class="certificate-course-info">

                            <div class="certificate-icon">
                                ⏳
                            </div>

                            <div>

                                <h3>
                                    ${escapeHtml(courseTitle)}
                                </h3>

                                <p>
                                    Solicitação enviada.
                                    Aguarde a análise do administrador.
                                </p>

                            </div>

                        </div>

                        <button
                            class="gold-action"
                            disabled
                        >
                            ⏳ Pedido pendente
                        </button>

                    </div>
                `;
            }

            // ======================================
            // PEDIDO APROVADO
            // ======================================

            if (request.estado === "aprovado") {

                return `
                    <div class="certificate-course-card">

                        <div class="certificate-course-info">

                            <div class="certificate-icon">
                                🏆
                            </div>

                            <div>

                                <h3>
                                    ${escapeHtml(courseTitle)}
                                </h3>

                                <p>
                                    O seu pedido de certificado
                                    foi aprovado.
                                </p>

                            </div>

                        </div>

                        <button
                            class="gold-action"
                            disabled
                        >
                            ✓ Certificado aprovado mandaremos <br>
                            um teste por email
                        </button>

                    </div>
                `;
            }

            // ======================================
            // PEDIDO REJEITADO
            // ======================================

            if (request.estado === "rejeitado") {

                return `
                    <div class="certificate-course-card">

                        <div class="certificate-course-info">

                            <div class="certificate-icon">
                                ⚠️
                            </div>

                            <div>

                                <h3>
                                    ${escapeHtml(courseTitle)}
                                </h3>

                                <p>
                                    A solicitação de certificado
                                    foi rejeitada.
                                </p>

                            </div>

                        </div>

                        <button
                            class="gold-action"
                            disabled
                        >
                            ✕ Pedido rejeitado
                        </button>

                    </div>
                `;
            }

            // ======================================
            // ESTADO DESCONHECIDO
            // ======================================

            return `
                <div class="certificate-course-card">

                    <div class="certificate-course-info">

                        <div class="certificate-icon">
                            🎓
                        </div>

                        <div>

                            <h3>
                                ${escapeHtml(courseTitle)}
                            </h3>

                            <p>
                                Pedido de certificado encontrado.
                            </p>

                        </div>

                    </div>

                    <button
                        class="gold-action"
                        disabled
                    >
                        Verificar pedido
                    </button>

                </div>
            `;

        }).join("");

        // ==========================================
        // BOTÕES DE SOLICITAÇÃO
        // ==========================================

        const buttons = container.querySelectorAll(
            ".certificate-request-button"
        );

        buttons.forEach(button => {

            button.addEventListener("click", async () => {

                const courseId =
                    button.dataset.courseId;

                const course =
                    courses.find(
                        item => item.$id === courseId
                    );

                if (!course) {
                    alert("Curso não encontrado.");
                    return;
                }

                button.disabled = true;
                button.textContent = "A enviar...";

                await requestCertificate(user, course);

            });

        });

    } catch (error) {

        console.error(
            "❌ Erro ao carregar certificados:",
            error
        );

        container.innerHTML = `
            <div class="error-state">

                <div class="error-icon">
                    ⚠️
                </div>

                <h3>
                    Não foi possível carregar os certificados
                </h3>

                <p>
                    Tente atualizar a página.
                </p>

            </div>
        `;
    }
}


/* =====================================================
   NOTIFICAÇÕES DO ESTUDANTE
===================================================== */

const NOTIFICATION_STORAGE_PREFIX = "te_student_notifications_";

function notificationStorageKey(userId) {
    return `${NOTIFICATION_STORAGE_PREFIX}${userId}`;
}

function getReadNotificationKeys(userId) {
    try {
        return JSON.parse(
            localStorage.getItem(notificationStorageKey(userId)) || "[]"
        );
    } catch (_) {
        return [];
    }
}

function saveReadNotificationKeys(userId, keys) {
    localStorage.setItem(
        notificationStorageKey(userId),
        JSON.stringify([...new Set(keys)].slice(-200))
    );
}

function formatNotificationDate(value) {
    if (!value) return "Agora";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Agora";
    }

    return date.toLocaleString("pt-AO", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function buildNotifications(user, courses, allPublishedCourses, certificateRequests, courseProgress) {
    const notifications = [];

    const enrolledIds = new Set(courses.map(course => course.$id));

    allPublishedCourses
        .filter(course => !enrolledIds.has(course.$id))
        .forEach(course => {
            notifications.push({
                key: `course-available:${course.$id}`,
                icon: "+",
                title: "Nova formação disponível",
                text: `${course.titulo || "Uma nova formação"} está disponível no catálogo.`,
                date: course.$updatedAt || course.$createdAt,
                section: "adicionar"
            });
        });

    courses.forEach(course => {
        const progress = courseProgress[course.$id];

        if (
            progress &&
            progress.total > 0 &&
            progress.completed >= progress.total
        ) {
            notifications.push({
                key: `course-completed:${course.$id}`,
                icon: "✓",
                title: "Formação concluída",
                text: `Concluíste a formação "${course.titulo || "Curso"}".`,
                date: course.$updatedAt || course.$createdAt,
                section: "certificados"
            });
        }
    });

    certificateRequests.forEach(request => {
        const courseName = request.curso || "formação";

        let title = "Pedido de certificado";
        let text = `O pedido para "${courseName}" está pendente.`;
        let icon = "⏳";

        if (request.estado === "aprovado") {
            title = "Certificado aprovado";
            text = `O teu certificado de "${courseName}" foi aprovado.`;
            icon = "✓";
        } else if (request.estado === "rejeitado") {
            title = "Pedido de certificado atualizado";
            text = `O pedido de "${courseName}" foi rejeitado.`;
            icon = "!";
        }

        notifications.push({
            key: `certificate:${request.$id}:${request.estado}`,
            icon,
            title,
            text,
            date: request.$updatedAt || request.data_pedido,
            section: "certificados"
        });
    });

    if (!notifications.length) {
        notifications.push({
            key: "welcome",
            icon: "TE",
            title: "Bem-vindo à Sala Virtual",
            text: "Aqui encontrarás as tuas formações, progresso e atualizações.",
            date: new Date().toISOString(),
            section: "inicio"
        });
    }

    return notifications.sort(
        (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
    );
}

async function getCertificateRequestsForStudent(userId) {
    try {
        const result = await databases.listDocuments(
            DATABASE_ID,
            CERTIFICATE_REQUESTS_COLLECTION_ID,
            [
                Appwrite.Query.equal("student_id", userId),
                Appwrite.Query.orderDesc("$createdAt"),
                Appwrite.Query.limit(100)
            ]
        );

        return result.documents || [];
    } catch (error) {
        console.warn("⚠️ Não foi possível carregar notificações de certificados:", error);
        return [];
    }
}

function renderNotifications(user, notifications) {
    const list = document.getElementById("notificationList");
    const badge = document.getElementById("notificationBadge");

    if (!list || !badge) return;

    const readKeys = getReadNotificationKeys(user.$id);
    const unreadCount = notifications.filter(
        item => !readKeys.includes(item.key)
    ).length;

    badge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
    badge.hidden = unreadCount === 0;

    if (!notifications.length) {
        list.innerHTML = `
            <div class="notification-empty">
                Não existem notificações novas.
            </div>
        `;
        return;
    }

    list.innerHTML = notifications.map(item => {
        const unread = !readKeys.includes(item.key);

        return `
            <article
                class="notification-item ${unread ? "unread" : ""}"
                data-notification-key="${escapeHtml(item.key)}"
                data-notification-section="${escapeHtml(item.section || "inicio")}"
            >
                <div class="notification-icon">
                    ${escapeHtml(item.icon)}
                </div>

                <div>
                    <h4>${escapeHtml(item.title)}</h4>
                    <p>${escapeHtml(item.text)}</p>
                    <time>${escapeHtml(formatNotificationDate(item.date))}</time>
                </div>
            </article>
        `;
    }).join("");

    list.querySelectorAll(".notification-item").forEach(item => {
        item.addEventListener("click", () => {
            const keys = getReadNotificationKeys(user.$id);
            keys.push(item.dataset.notificationKey);
            saveReadNotificationKeys(user.$id, keys);

            renderNotifications(user, notifications);

            const section = item.dataset.notificationSection;
            if (section) {
                switchSection(section);
            }

            closeNotifications();
        });
    });
}

async function loadNotifications(user, courses, allPublishedCourses, courseProgress) {
    const certificateRequests =
        await getCertificateRequestsForStudent(user.$id);

    const notifications = buildNotifications(
        user,
        courses,
        allPublishedCourses,
        certificateRequests,
        courseProgress
    );

    renderNotifications(user, notifications);

    return notifications;
}

function openNotifications() {
    const button = document.getElementById("notificationBtn");
    const panel = document.getElementById("notificationPanel");

    if (!button || !panel) return;

    panel.hidden = false;
    button.setAttribute("aria-expanded", "true");
}

function closeNotifications() {
    const button = document.getElementById("notificationBtn");
    const panel = document.getElementById("notificationPanel");

    if (!button || !panel) return;

    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
}

function showNotificationToast(title, text) {
    document.querySelector(".notification-toast")?.remove();

    const toast = document.createElement("div");
    toast.className = "notification-toast";

    toast.innerHTML = `
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(text)}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 5000);
}

function setupNotificationUI() {
    const button = document.getElementById("notificationBtn");
    const panel = document.getElementById("notificationPanel");
    const markRead = document.getElementById("markNotificationsRead");

    if (!button || !panel) return;

    button.addEventListener("click", event => {
        event.stopPropagation();

        if (panel.hidden) {
            openNotifications();
        } else {
            closeNotifications();
        }
    });

    panel.addEventListener("click", event => {
        event.stopPropagation();
    });

    markRead?.addEventListener("click", async () => {
        const user = await account.get();
        const items = panel.querySelectorAll(".notification-item");
        const keys = getReadNotificationKeys(user.$id);

        items.forEach(item => keys.push(item.dataset.notificationKey));

        saveReadNotificationKeys(user.$id, keys);

        const courses = await getStudentCoursesForNotifications(user);
        const allCourses = await getAllPublishedCourses();

        const progressDocuments = await getStudentProgress(user.$id);
        const courseProgress = {};

        for (const course of courses) {
            const total = await getCourseLessons(course.$id);

            const completed = new Set(
                progressDocuments
                    .filter(
                        item =>
                            item.course_id === course.$id &&
                            item.completed === true
                    )
                    .map(item => item.lesson_id)
            ).size;

            courseProgress[course.$id] = {
                total,
                completed,
                percentage: total
                    ? Math.min(100, Math.round((completed / total) * 100))
                    : 0
            };
        }

        await loadNotifications(
            user,
            courses,
            allCourses,
            courseProgress
        );
    });

    document.addEventListener("click", () => closeNotifications());

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeNotifications();
        }
    });
}

async function getStudentCoursesForNotifications(user) {
    const profile = await getStudentProfile(user);
    const enrollments = await getEnrollments(
        user.$id,
        profile?.$id
    );

    const ids = [
        ...new Set(
            enrollments
                .map(item => item.course_id)
                .filter(Boolean)
        )
    ];

    const courses = [];

    for (const id of ids) {
        const course = await getCourse(id);

        if (course && course.publicado !== false) {
            courses.push(course);
        }
    }

    return courses;
}

function setupNotificationRealtime(user) {
    if (!client || typeof client.subscribe !== "function") {
        console.warn("⚠️ Realtime do Appwrite não está disponível neste SDK.");
        return;
    }

    const channels = [
        `databases.${DATABASE_ID}.collections.${CERTIFICATE_REQUESTS_COLLECTION_ID}.documents`,
        `databases.${DATABASE_ID}.collections.${COURSES_COLLECTION_ID}.documents`
    ];

    client.subscribe(channels, async event => {
        const payload = event.payload || {};

        const isForStudent =
            !payload.student_id ||
            payload.student_id === user.$id;

        if (
            event.events?.some(
                item =>
                    item.includes(".update") ||
                    item.includes(".create")
            ) &&
            isForStudent
        ) {
            showNotificationToast(
                "Nova atualização",
                "Há uma nova atualização disponível no teu portal."
            );

            await loadDashboard();
        }
    });
}

async function loadDashboard() {
    const user = await requireUser();

    if (!user) return;

    try {
        const profile = await getStudentProfile(user);

        renderStudentIdentity(user, profile);

        const enrollments =
            await getEnrollments(
                user.$id,
                profile?.$id
            );

        const courseIds = [
            ...new Set(
                enrollments
                    .map(item => item.course_id)
                    .filter(Boolean)
            )
        ];

        const enrolledIds = new Set(courseIds);

        const courses = [];

        for (const courseId of courseIds) {
            const course = await getCourse(courseId);

            if (
                course &&
                course.publicado !== false
            ) {
                courses.push(course);
            }
        }

        const allPublishedCourses =
            await getAllPublishedCourses();

        renderAvailableCourses(
            allPublishedCourses,
            enrolledIds,
            user
        );

        const progressDocuments =
            await getStudentProgress(user.$id);

        const courseProgress = {};

        for (const course of courses) {
            const total =
                await getCourseLessons(course.$id);

            const completedIds =
                new Set(
                    progressDocuments
                        .filter(
                            item =>
                                item.course_id ===
                                    course.$id &&
                                item.completed === true
                        )
                        .map(
                            item =>
                                item.lesson_id
                        )
                );

            const completed =
                completedIds.size;

            const percentage =
                total
                    ? Math.min(
                          100,
                          Math.round(
                              (completed /
                                  total) *
                                  100
                          )
                      )
                    : 0;

            courseProgress[course.$id] = {
                total,
                completed,
                percentage
            };
        }

        updateCounters(
            courses,
            courseProgress
        );

        renderFeaturedCourses(
            courses,
            courseProgress
        );

        renderCourses(
            courses,
            courseProgress
        );

        renderProgress(
            courses,
            courseProgress
        );

        renderCertificateRequests(
            user,
            courses,
            courseProgress
        );

        await loadNotifications(
            user,
            courses,
            allPublishedCourses,
            courseProgress
        );

    } catch (error) {
        console.error(
            "❌ Erro ao carregar dashboard:",
            error
        );
    }
}

async function logout() {
    try {
        await account.deleteSession("current");
    } catch (error) {
        console.warn("⚠️ Erro ao terminar sessão:", error);
    } finally {
        window.location.href = "login.html";
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    document.querySelectorAll(".student-nav-link").forEach(button => {
        button.addEventListener("click", () =>
            switchSection(button.dataset.section)
        );
    });

    document.querySelectorAll("[data-go-section]").forEach(button => {
        button.addEventListener("click", () =>
            switchSection(button.dataset.goSection)
        );
    });

    document.getElementById("sidebarToggle")
        ?.addEventListener("click", openSidebar);

    document.getElementById("sidebarOverlay")
        ?.addEventListener("click", closeSidebar);

    document.getElementById("logoutBtn")
        ?.addEventListener("click", logout);

    document.getElementById("editProfileBtn")
        ?.addEventListener("click", async () => {
            const user = await account.get();
            const profile = await getStudentProfile(user);
            openProfileEditor(user, profile);
        });

    document.getElementById("cancelProfileBtn")
        ?.addEventListener("click", () => {
            document.getElementById("profileEditPanel").hidden = true;
            document.getElementById("profileMessage").textContent = "";
        });

    document.getElementById("profileForm")
        ?.addEventListener("submit", async event => {
            event.preventDefault();

            const user = await account.get();

            await saveProfile(user);
        });

    setupNotificationUI();

    const hash =
        window.location.hash.replace("#", "");

    switchSection(
        STUDENT_SECTIONS.includes(hash)
            ? hash
            : "inicio"
    );

    const user = await requireUser();

    if (!user) return;

    setupNotificationRealtime(user);

    await loadDashboard();
});

