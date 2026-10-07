async function requireUser() {
    try {
        return await account.get();
    } catch (_) {
        window.location.href = "login.html";
        return null;
    }
}

async function start() {

    const user = await requireUser();

    if (!user) return;

    const id =
        new URLSearchParams(location.search).get("id");

    if (!id) {
        window.location.href = "dashboard.html";
        return;
    }

    // ==============================
    // CARREGAR CURSO
    // ==============================

    let course;

    try {

        course = await databases.getDocument(
            DATABASE_ID,
            COURSES_COLLECTION_ID,
            id
        );

    } catch (error) {

        console.error("❌ Curso:", error);

        document.getElementById("modules").innerHTML =
            '<div class="loading">Não foi possível carregar este curso.</div>';

        return;
    }

    // ==============================
    // VERIFICAR PUBLICAÇÃO
    // ==============================

    if (course.publicado === false) {

        document.getElementById("modules").innerHTML =
            '<div class="loading">Este curso não está disponível.</div>';

        return;
    }

    // ==============================
    // CABEÇALHO
    // ==============================

    document.getElementById("courseHeader").innerHTML = `

        <span class="section-title">
            <span>FORMAÇÃO</span>
        </span>

        <h1>${escapeHtml(course.titulo)}</h1>

        <p>${escapeHtml(course.descricao || "")}</p>

    `;

    // ==============================
    // CARREGAR MÓDULOS
    // ==============================

    let modules = [];

    try {

        const result =
            await databases.listDocuments(
                DATABASE_ID,
                MODULES_COLLECTION_ID,
                [
                    Appwrite.Query.equal(
                        "course_id",
                        id
                    ),

                    Appwrite.Query.orderAsc(
                        "ordem"
                    ),

                    Appwrite.Query.limit(100)
                ]
            );

        modules = result.documents;

    } catch (error) {

        console.error(
            "❌ Módulos:",
            error
        );
    }

    const container =
        document.getElementById("modules");

    if (!modules.length) {

        container.innerHTML =
            '<div class="loading">Ainda não existem módulos neste curso.</div>';

        return;
    }

    container.innerHTML = "";

    // ==============================
    // CONTADORES DO CURSO
    // ==============================

    let totalLessons = 0;

    let lessonIds = [];

    // ==============================
    // CARREGAR MÓDULOS + AULAS
    // ==============================

    for (const module of modules) {

        let lessons = [];

        try {

            const result =
                await databases.listDocuments(
                    DATABASE_ID,
                    LESSONS_COLLECTION_ID,
                    [

                        Appwrite.Query.equal(
                            "modulo_id",
                            module.$id
                        ),

                        Appwrite.Query.equal(
                            "publicado",
                            true
                        ),

                        Appwrite.Query.orderAsc(
                            "ordem"
                        ),

                        Appwrite.Query.limit(100)

                    ]
                );

            lessons = result.documents;

        } catch (error) {

            console.error(
                "❌ Aulas do módulo:",
                module.$id,
                error
            );
        }

        // Contar aulas
        totalLessons += lessons.length;

        // Guardar IDs das aulas
        lessons.forEach(
            lesson => lessonIds.push(lesson.$id)
        );

        // ==============================
        // CRIAR MÓDULO
        // ==============================

        const box =
            document.createElement("section");

        box.className = "module";

        box.innerHTML = `

            <div class="module-header">

                ${escapeHtml(module.titulo)}

            </div>

            <div class="lessons">

                ${
                    lessons.length

                    ?

                    lessons.map(
                        lesson => `

                            <div class="lesson">

                                <span class="lesson-title">

                                    ${escapeHtml(
                                        lesson.titulo
                                    )}

                                </span>

                                <a
                                    class="lesson-status"
                                    href="aula.html?id=${encodeURIComponent(
                                        lesson.$id
                                    )}&course=${encodeURIComponent(
                                        id
                                    )}"
                                >

                                    ABRIR AULA →

                                </a>

                            </div>

                        `
                    ).join("")

                    :

                    '<div class="loading">Sem aulas publicadas.</div>'
                }

            </div>
        `;

        container.appendChild(box);
    }

    // ==============================
    // CALCULAR PROGRESSO
    // ==============================

    let completedLessons = 0;

    if (lessonIds.length > 0) {

        try {

            const progressResult =
                await databases.listDocuments(
                    DATABASE_ID,
                    PROGRESS_COLLECTION_ID,
                    [

                        Appwrite.Query.equal(
                            "student_id",
                            user.$id
                        ),

                        Appwrite.Query.equal(
                            "course_id",
                            id
                        ),

                        Appwrite.Query.limit(100)
                    ]
                );

            const progressDocuments =
                progressResult.documents;

            // IDs das aulas concluídas
            const completedIds =
                new Set(
                    progressDocuments
                        .filter(
                            item =>
                                item.completed === true
                        )
                        .map(
                            item =>
                                item.lesson_id
                        )
                );

            // Contar somente aulas
            // que realmente pertencem a este curso
            completedLessons =
                lessonIds.filter(
                    lessonId =>
                        completedIds.has(
                            lessonId
                        )
                ).length;

            console.log(
                "📊 Progresso:",
                completedLessons,
                "/",
                totalLessons
            );

        } catch (error) {

            console.error(
                "❌ Erro ao carregar progresso:",
                error
            );
        }
    }

    // ==============================
    // PORCENTAGEM
    // ==============================

    let percentage = 0;

    if (totalLessons > 0) {

        percentage =
            Math.round(
                (completedLessons /
                    totalLessons) *
                100
            );
    }

    // ==============================
    // MOSTRAR PROGRESSO
    // ==============================

    const progressLessons =
        document.getElementById(
            "progressLessons"
        );

    const progressPercent =
        document.getElementById(
            "progressPercent"
        );

    const progressFill =
        document.getElementById(
            "progressFill"
        );

    if (progressLessons) {

        progressLessons.textContent =
            `${completedLessons} / ${totalLessons} aulas`;
    }

    if (progressPercent) {

        progressPercent.textContent =
            `${percentage}%`;
    }

    if (progressFill) {

        progressFill.style.width =
            `${percentage}%`;
    }

    console.log(
        `📈 Progresso final: ${percentage}%`
    );
}


// ==============================
// ESCAPAR HTML
// ==============================

function escapeHtml(value) {

    return String(value ?? "").replace(
        /[&<>"']/g,
        c => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[c])
    );
}


// ==============================
// LOGOUT
// ==============================

document
    .getElementById("logoutBtn")
    ?.addEventListener(
        "click",
        async () => {

            try {

                await account.deleteSession(
                    "current"
                );

            } finally {

                window.location.href =
                    "login.html";
            }
        }
    );


// ==============================
// INICIAR
// ==============================

start();