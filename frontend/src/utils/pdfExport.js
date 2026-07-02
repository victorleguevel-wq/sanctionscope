import jsPDF from "jspdf";

const MARGIN = 18;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;

const COLORS = {
    primary: [37, 99, 235],
    dark: [15, 23, 42],
    gray: [100, 116, 139],
    lightGray: [148, 163, 184],
    border: [226, 232, 240],
    bgLight: [241, 245, 249],
};

export function exportAnalysisPDF(question, answer, entitiesUsed, gdeltEvents) {
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    let y = MARGIN;

    const checkPageBreak = (needed) => {
        if (y + needed > PAGE_H - MARGIN) {
            pdf.addPage();
            y = MARGIN;
            return true;
        }
        return false;
    };

    const setColor = (c) => pdf.setTextColor(c[0], c[1], c[2]);
    const setFillColor = (c) => pdf.setFillColor(c[0], c[1], c[2]);
    const setDrawColor = (c) => pdf.setDrawColor(c[0], c[1], c[2]);

    setFillColor(COLORS.primary);
    pdf.rect(0, 0, PAGE_W, 4, "F");

    y = 22;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    setColor(COLORS.dark);
    pdf.text("SanctionScope", MARGIN, y);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    setColor(COLORS.gray);
    const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    pdf.text(dateStr, PAGE_W - MARGIN, y, { align: "right" });

    y += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    setColor(COLORS.gray);
    pdf.text(`Analyse : ${question}`, MARGIN, y);

    y += 4;
    setDrawColor(COLORS.border);
    pdf.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 10;

    if (answer.summary) {
        setFillColor(COLORS.bgLight);
        const summaryLines = pdf.splitTextToSize(answer.summary, CONTENT_W - 10);
        const boxHeight = summaryLines.length * 5 + 14;
        checkPageBreak(boxHeight);
        pdf.roundedRect(MARGIN, y, CONTENT_W, boxHeight, 2, 2, "F");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        setColor(COLORS.primary);
        pdf.text("SYNTHESE", MARGIN + 5, y + 7);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10.5);
        setColor(COLORS.dark);
        pdf.text(summaryLines, MARGIN + 5, y + 14);

        y += boxHeight + 8;
    }

    if (entitiesUsed?.length > 0) {
        checkPageBreak(20);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        setColor(COLORS.gray);
        pdf.text(`DONNEES - ${entitiesUsed.length} ENTITES SANCTIONNEES UTILISEES`, MARGIN, y);
        y += 6;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        let lineX = MARGIN;
        entitiesUsed.forEach(e => {
            const label = e.name;
            const w = pdf.getTextWidth(label) + 6;
            if (lineX + w > PAGE_W - MARGIN) {
                lineX = MARGIN;
                y += 6;
                checkPageBreak(6);
            }
            const isOfac = e.source === "OFAC";
            setDrawColor(isOfac ? [124, 58, 237] : [59, 130, 246]);
            setColor(isOfac ? [124, 58, 237] : [59, 130, 246]);
            pdf.roundedRect(lineX, y - 4, w, 5.5, 2, 2, "S");
            pdf.text(label, lineX + 3, y);
            lineX += w + 2;
        });
        y += 12;
    }

    if (answer.timeline?.length > 0) {
        checkPageBreak(15);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        setColor(COLORS.gray);
        pdf.text("CHRONOLOGIE", MARGIN, y);
        y += 8;

        answer.timeline.forEach(item => {
            const eventLines = pdf.splitTextToSize(item.event, CONTENT_W - 35);
            const itemHeight = eventLines.length * 4.5 + 4;
            checkPageBreak(itemHeight);

            const impColor = item.importance === "high" ? [239, 68, 68] :
                item.importance === "medium" ? [249, 115, 22] : [59, 130, 246];

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(9);
            setColor(impColor);
            pdf.text(item.date, MARGIN, y);

            setFillColor(impColor);
            pdf.circle(MARGIN + 28, y - 1.3, 1.2, "F");

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9.5);
            setColor(COLORS.dark);
            pdf.text(eventLines, MARGIN + 33, y);

            y += itemHeight;
        });
        y += 6;
    }

    if (answer.sections?.length > 0) {
        checkPageBreak(15);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        setColor(COLORS.gray);
        pdf.text("ANALYSE DETAILLEE", MARGIN, y);
        y += 8;

        answer.sections.forEach(section => {
            const contentLines = pdf.splitTextToSize(section.content, CONTENT_W);
            const sectionHeight = contentLines.length * 4.5 + 10;
            checkPageBreak(sectionHeight);

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(11);
            setColor(COLORS.dark);
            pdf.text(section.title, MARGIN, y);
            y += 6;

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9.5);
            setColor(COLORS.gray);
            pdf.text(contentLines, MARGIN, y);
            y += contentLines.length * 4.5 + 6;
        });
    }

    if (answer.key_figures?.length > 0) {
        checkPageBreak(15);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        setColor(COLORS.gray);
        pdf.text("ENTITES CITEES", MARGIN, y);
        y += 8;

        answer.key_figures.forEach(fig => {
            const roleLines = pdf.splitTextToSize(fig.role || "", CONTENT_W - 10);
            const h = roleLines.length * 4 + 9;
            checkPageBreak(h);

            setFillColor(COLORS.bgLight);
            pdf.roundedRect(MARGIN, y - 4, CONTENT_W, h, 2, 2, "F");

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(9.5);
            setColor(COLORS.dark);
            pdf.text(fig.name, MARGIN + 4, y);

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8.5);
            setColor(COLORS.gray);
            pdf.text(roleLines, MARGIN + 4, y + 5);

            pdf.setFontSize(7.5);
            setColor(COLORS.primary);
            pdf.text(fig.source || "", PAGE_W - MARGIN - 4, y, { align: "right" });

            y += h + 3;
        });
        y += 4;
    }

    if (gdeltEvents?.length > 0) {
        checkPageBreak(15);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        setColor(COLORS.gray);
        pdf.text("EVENEMENTS RECENTS - GDELT TEMPS REEL", MARGIN, y);
        y += 8;

        gdeltEvents.slice(0, 8).forEach(ev => {
            checkPageBreak(10);
            const tone = ev.goldstein || 0;
            const toneColor = tone < -5 ? [239, 68, 68] : tone < 0 ? [249, 115, 22] : [16, 185, 129];

            setFillColor(toneColor);
            pdf.circle(MARGIN + 1.5, y - 1.3, 1, "F");

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);
            setColor(COLORS.dark);
            const actor2Part = (ev.actor2 && ev.actor2 !== "nan") ? ("-> " + ev.actor2) : "";
            const label = `${ev.actor1 !== "nan" ? ev.actor1 : ""} ${actor2Part} - ${ev.event_type}`;
            pdf.text(label, MARGIN + 6, y);

            pdf.setFontSize(7.5);
            setColor(COLORS.lightGray);
            pdf.text(`${ev.location} - ${ev.date}`, MARGIN + 6, y + 4);

            y += 10;
        });
    }

    if (answer.sources?.length > 0) {
        checkPageBreak(15);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        setColor(COLORS.gray);
        pdf.text("SOURCES", MARGIN, y);
        y += 7;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        answer.sources.forEach(src => {
            checkPageBreak(5);
            setColor(COLORS.primary);
            const icon = src.type === "sanctions" ? "[Sanctions] " : src.type === "gdelt" ? "[GDELT] " : "[General] ";
            pdf.text(`${icon}${src.label}`, MARGIN, y);
            y += 5;
        });
    }

    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        setColor(COLORS.lightGray);
        pdf.text(
            `SanctionScope - Donnees OFAC / ONU / GDELT - Page ${i}/${pageCount}`,
            PAGE_W / 2, PAGE_H - 10, { align: "center" }
        );
    }

    const filename = `sanctionscope-${question.slice(0, 40).replace(/\s+/g, "-").toLowerCase()}.pdf`;
    pdf.save(filename);
}