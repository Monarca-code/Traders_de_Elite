async function requireUser() {
    try {
        return await account.get();
    } catch (_) {
        window.location.href = "login.html";
        return null;
    }
}


// =====================================================
// CARREGAR TODAS AS AULAS DO CURSO
// =====================================================

async function getCourseLessons(courseId) {

    const allLessons = [];

    if (!courseId) {
        return allLessons;
    }

    try {

        // =============================================
        // CARREGAR MÓDULOS
        // =============================================

        const modulesResult =
            await databases.listDocuments(
                DATABASE_ID,
                MODULES_COLLECTION_ID,
                [
                    Appwrite.Query.equal(
                        "course_id",
                        courseId
                    ),

                    Appwrite.Query.orderAsc(
                        "ordem"
                    ),

                    Appwrite.Query.limit(100)
                ]
            );

        const modules =
            modulesResult.documents;

        console.log(
            "📚 Módulos encontrados:",
            modules
        );

        // =============================================
        // CARREGAR AULAS DE CADA MÓDULO
        // =============================================

        for (const module of modules) {

            try {

                const lessonsResult =
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

                const lessons =
                    lessonsResult.documents;

                // =====================================
                // ADICIONAR AULAS À LISTA
                // =====================================

                for (const lesson of lessons) {

                    allLessons.push({
                        ...lesson,
                        moduleTitle:
                            module.titulo || ""
                    });
                }

            } catch (error) {

                console.warn(
                    "⚠️ Erro ao carregar aulas do módulo:",
                    module.$id,
                    error
                );
            }
        }

    } catch (error) {

        console.error(
            "❌ Erro ao carregar módulos:",
            error
        );
    }

    console.log(
        "📖 Todas as aulas do curso:",
        allLessons
    );

    return allLessons;
}


// =====================================================
// CONFIGURAR NAVEGAÇÃO
// =====================================================

function setupLessonNavigation(
    lessons,
    currentLessonId,
    courseId
) {

    const previousButton =
        document.getElementById(
            "previousLesson"
        );

    const nextButton =
        document.getElementById(
            "nextLesson"
        );

    const position =
        document.getElementById(
            "lessonPosition"
        );

    // =============================================
    // SE OS ELEMENTOS NÃO EXISTIREM
    // =============================================

    if (
        !previousButton ||
        !nextButton ||
        !position
    ) {

        console.warn(
            "⚠️ Elementos de navegação não encontrados."
        );

        return;
    }

    // =============================================
    // LOCALIZAR AULA ATUAL
    // =============================================

    const currentIndex =
        lessons.findIndex(
            lesson =>
                lesson.$id === currentLessonId
        );

    // =============================================
    // AULA NÃO ENCONTRADA
    // =============================================

    if (currentIndex === -1) {

        position.textContent =
            "Aula atual";

        previousButton.classList.add(
            "disabled"
        );

        nextButton.classList.add(
            "disabled"
        );

        return;
    }

    const currentNumber =
        currentIndex + 1;

    const totalLessons =
        lessons.length;

    // =============================================
    // INDICADOR
    // =============================================

    position.textContent =
        `Aula ${currentNumber} de ${totalLessons}`;

    // =============================================
    // AULA ANTERIOR
    // =============================================

    if (currentIndex > 0) {

        const previousLesson =
            lessons[currentIndex - 1];

        previousButton.href =
            `aula.html?id=${encodeURIComponent(
                previousLesson.$id
            )}&course=${encodeURIComponent(
                courseId
            )}`;

        previousButton.classList.remove(
            "disabled"
        );

        previousButton.textContent =
            "← Aula anterior";

    } else {

        previousButton.href =
            "javascript:void(0)";

        previousButton.classList.add(
            "disabled"
        );

        previousButton.textContent =
            "← Primeira aula";
    }

    // =============================================
    // PRÓXIMA AULA
    // =============================================

    if (
        currentIndex <
        totalLessons - 1
    ) {

        const nextLesson =
            lessons[currentIndex + 1];

        nextButton.href =
            `aula.html?id=${encodeURIComponent(
                nextLesson.$id
            )}&course=${encodeURIComponent(
                courseId
            )}`;

        nextButton.classList.remove(
            "disabled"
        );

        nextButton.textContent =
            "Próxima aula →";

    } else {

        nextButton.href =
            `course.html?id=${encodeURIComponent(
                courseId
            )}`;

        nextButton.classList.remove(
            "disabled"
        );

        nextButton.textContent =
            "Voltar ao curso →";
    }

    console.log(
        "📍 Posição:",
        `${currentNumber}/${totalLessons}`
    );
}


// =====================================================
// INICIAR
// =====================================================

async function start() {

    const user =
        await requireUser();

    if (!user) return;

    const params =
        new URLSearchParams(
            location.search
        );

    const lessonId =
        params.get("id");

    const courseId =
        params.get("course");

    // =============================================
    // VERIFICAR ID DA AULA
    // =============================================

    if (!lessonId) {

        window.location.href =
            "dashboard.html";

        return;
    }

    // =============================================
    // BOTÃO VOLTAR
    // =============================================

    if (courseId) {

        const backCourse =
            document.getElementById(
                "backCourse"
            );

        if (backCourse) {

            backCourse.href =
                `course.html?id=${encodeURIComponent(
                    courseId
                )}`;
        }
    }

    // =============================================
    // CARREGAR AULA
    // =============================================

    let lesson;

    try {

        lesson =
            await databases.getDocument(
                DATABASE_ID,
                LESSONS_COLLECTION_ID,
                lessonId
            );

        console.log(
            "✅ Aula encontrada:",
            lesson
        );

    } catch (error) {

        console.error(
            "❌ Erro ao carregar aula:",
            error
        );

        const header =
            document.getElementById(
                "lessonHeader"
            );

        if (header) {

            header.innerHTML =
                '<div class="loading">Não foi possível carregar esta aula.</div>';
        }

        return;
    }

    // =============================================
    // VERIFICAR PUBLICAÇÃO
    // =============================================

    if (lesson.publicado === false) {

        const header =
            document.getElementById(
                "lessonHeader"
            );

        if (header) {

            header.innerHTML =
                '<div class="loading">Esta aula não está disponível.</div>';
        }

        return;
    }

    // =============================================
    // CABEÇALHO
    // =============================================

    const lessonHeader =
        document.getElementById(
            "lessonHeader"
        );

    if (lessonHeader) {

        lessonHeader.innerHTML = `
            <span class="section-title">
                <span>AULA</span>
            </span>

            <h1>
                ${escapeHtml(lesson.titulo)}
            </h1>

            <p>
                ${escapeHtml(
                    lesson.descricao || ""
                )}
            </p>
        `;
    }

    // =============================================
    // VÍDEO
    // =============================================

    const video =
        document.getElementById(
            "video"
        );

    if (
        video &&
        lesson.video_url
    ) {

        let videoUrl =
            lesson.video_url.trim();

        // =========================================
        // YOUTUBE
        // =========================================

        if (
            videoUrl.includes(
                "youtube.com/watch?v="
            )
        ) {

            const videoId =
                videoUrl
                    .split("v=")[1]
                    .split("&")[0];

            videoUrl =
                `https://www.youtube.com/embed/${videoId}`;

        }

        // =========================================
        // YOUTUBE SHORT URL
        // =========================================

        else if (
            videoUrl.includes(
                "youtu.be/"
            )
        ) {

            const videoId =
                videoUrl
                    .split("youtu.be/")[1]
                    .split("?")[0];

            videoUrl =
                `https://www.youtube.com/embed/${videoId}`;
        }

        video.innerHTML = `
            <iframe
                src="${escapeHtml(videoUrl)}"
                title="${escapeHtml(
                    lesson.titulo
                )}"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen>
            </iframe>
        `;

    } else if (video) {

        video.innerHTML = `
            <div
                class="loading"
                style="padding:30px"
            >
                O vídeo desta aula ainda não foi configurado.
            </div>
        `;
    }

    // =============================================
    // CONTEÚDO
    // =============================================

    const lessonContent =
        document.getElementById(
            "lessonContent"
        );

    if (lessonContent) {

        lessonContent.textContent =
            lesson.conteudo || "";
    }

    // =============================================
    // NAVEGAÇÃO ENTRE AULAS
    // =============================================

    if (courseId) {

        const lessons =
            await getCourseLessons(
                courseId
            );

        setupLessonNavigation(
            lessons,
            lessonId,
            courseId
        );
    }

    // =============================================
    // BOTÃO DE PROGRESSO
    // =============================================

    const completeBtn =
        document.getElementById(
            "completeBtn"
        );

    if (!completeBtn) {

        console.warn(
            "⚠️ Botão #completeBtn não encontrado."
        );

        return;
    }

    let existing = null;

    // =============================================
    // PROCURAR PROGRESSO EXISTENTE
    // =============================================

    try {

        const result =
            await databases.listDocuments(
                DATABASE_ID,
                PROGRESS_COLLECTION_ID,
                [
                    Appwrite.Query.equal(
                        "student_id",
                        user.$id
                    ),

                    Appwrite.Query.equal(
                        "lesson_id",
                        lessonId
                    ),

                    Appwrite.Query.limit(1)
                ]
            );

        existing =
            result.documents[0] ||
            null;

        console.log(
            "📊 Progresso encontrado:",
            existing
        );

    } catch (error) {

        console.warn(
            "⚠️ Não foi possível verificar o progresso:",
            error
        );
    }

    // =============================================
    // AULA JÁ CONCLUÍDA?
    // =============================================

    if (
        existing &&
        existing.completed === true
    ) {

        completeBtn.textContent =
            "AULA CONCLUÍDA ✓";

        completeBtn.classList.add(
            "completed"
        );

        completeBtn.disabled =
            true;
    }

    // =============================================
    // MARCAR COMO CONCLUÍDA
    // =============================================

    completeBtn.addEventListener(
        "click",
        async () => {

            completeBtn.disabled =
                true;

            completeBtn.textContent =
                "A GUARDAR...";

            try {

                const payload = {

                    student_id:
                        user.$id,

                    course_id:
                        courseId,

                    lesson_id:
                        lessonId,

                    completed:
                        true,

                    progress:
                        100
                };

                console.log(
                    "💾 Salvando progresso:",
                    payload
                );

                // =================================
                // ATUALIZAR
                // =================================

                if (existing) {

                    await databases.updateDocument(
                        DATABASE_ID,
                        PROGRESS_COLLECTION_ID,
                        existing.$id,
                        payload
                    );

                    console.log(
                        "✅ Progresso atualizado!"
                    );

                }

                // =================================
                // CRIAR
                // =================================

                else {

                    await databases.createDocument(
                        DATABASE_ID,
                        PROGRESS_COLLECTION_ID,
                        Appwrite.ID.unique(),
                        payload
                    );

                    console.log(
                        "✅ Progresso criado!"
                    );
                }

                // =================================
                // ATUALIZAR BOTÃO
                // =================================

                completeBtn.textContent =
                    "AULA CONCLUÍDA ✓";

                completeBtn.classList.add(
                    "completed"
                );

            } catch (error) {

                console.error(
                    "❌ Erro ao guardar progresso:",
                    error
                );

                completeBtn.disabled =
                    false;

                completeBtn.textContent =
                    "MARCAR COMO CONCLUÍDA ✓";

                alert(
                    "Não foi possível guardar o progresso.\n\n" +
                    (error.message || "")
                );
            }
        }
    );
}


// =====================================================
// ESCAPAR HTML
// =====================================================

function escapeHtml(value) {

    return String(
        value ?? ""
    ).replace(
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


// =====================================================
// LOGOUT
// =====================================================

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


// =====================================================
// INICIAR
// =====================================================

start();