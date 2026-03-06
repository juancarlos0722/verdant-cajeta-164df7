// ═══════════════════════════════════════════════════════════
//  GENCODE-SHEETS-PATCH.js
//  Añade este <script src="gencode-sheets-patch.js"></script>
//  justo antes de </body> en tu index.html
// ═══════════════════════════════════════════════════════════

const GENCODE_API = {
  url: "https://script.google.com/macros/s/AKfycbyVuZeTYYjbImCj-r_yAOFHzaKACOUZH-aulwVP2upUBnymwfFs87sdZPTQ3rheE3eo/exec",
  async call(action, data = {}) {
    try {
      await fetch(this.url, {
        method: "POST",
        mode: "no-cors",
        headers: {"Content-Type": "text/plain"},
        body: JSON.stringify({ action, ...data })
      });
      return { success: true };
    } catch(e) {
      console.warn("[GENCODE-SHEETS] Sin conexión:", e.message);
      return { success: false };
    }
  },
  registerStudent: (nombre, codigo, password, grado) =>
    GENCODE_API.call("registerStudent", { nombre, codigo, password, grado }),
  logSession: (id, codigo, accion) =>
    GENCODE_API.call("logSession", { estudianteId: id, codigo, accion }),
  saveResponse: (id, codigo, nombre, semana, actividad, campo, respuesta, palabras) =>
    GENCODE_API.call("saveResponse", { estudianteId: id, estudianteCodigo: codigo, estudianteNombre: nombre, semana, actividad, campo, respuesta, palabras: palabras||0 }),
  saveAIAlert: (id, codigo, nombre, campo, tipoAlerta, fragmento, nivel, semana) =>
    GENCODE_API.call("saveAIAlert", { estudianteId: id, estudianteCodigo: codigo, estudianteNombre: nombre, campo, tipoAlerta, fragmento, nivel, semana: semana||"" }),
  exportAllData: () => GENCODE_API.call("exportData")
};

// Esperar a que el DOM y los scripts originales estén listos
document.addEventListener('DOMContentLoaded', () => {

  // ── Parchear addStudent ─────────────────────────────────
  const _origAdd = window.addStudent;
  window.addStudent = function() {
    const name  = document.getElementById('newName')?.value?.trim() || '';
    const code  = document.getElementById('newCode')?.value?.trim()?.toUpperCase() || '';
    const pass  = document.getElementById('newPass')?.value || '';
    const grade = document.getElementById('newGrade')?.value?.trim() || '';
    _origAdd?.call(this);
    if (name && code && pass) {
      GENCODE_API.registerStudent(name, code, pass, grade)
        .then(() => console.log('[GENCODE-SHEETS] ✅ Estudiante registrado:', code));
    }
  };

  // ── Parchear loginStudent ───────────────────────────────
  const _origLogin = window.loginStudent;
  window.loginStudent = function() {
    const code = document.getElementById('sCode')?.value?.trim()?.toUpperCase() || '';
    _origLogin?.call(this);
    if (code) {
      setTimeout(() => {
        GENCODE_API.logSession(code, code, 'login')
          .then(() => console.log('[GENCODE-SHEETS] ✅ Sesión registrada:', code));
      }, 500);
    }
  };

  // ── Parchear registerAlert ──────────────────────────────
  const _origAlert = window.registerAlert;
  window.registerAlert = function(studentCode, field, type, fragment, level) {
    _origAlert?.call(this, studentCode, field, type, fragment, level);
    GENCODE_API.saveAIAlert(studentCode, studentCode, studentCode, field, type, fragment, level, '')
      .then(() => console.log('[GENCODE-SHEETS] ✅ Alerta IA registrada:', type));
  };

  // ── Parchear saveStudentData ────────────────────────────
  const _origSave = window.saveStudentData;
  window.saveStudentData = function(code) {
    _origSave?.call(this, code);
    const app = document.getElementById('studentApp');
    const st  = window.currentStudent;
    if (!app || !st) return;
    app.querySelectorAll('textarea[data-field]').forEach(el => {
      const val = el.value.trim();
      if (val.length > 15) {
        const field  = el.getAttribute('data-field');
        const semana = field.startsWith('s1') ? 'Semana1'
                     : field.startsWith('s2') ? 'Semana2'
                     : field.startsWith('s3') ? 'Semana3'
                     : field.startsWith('s4') ? 'Semana4'
                     : field.startsWith('s5') ? 'Semana5'
                     : field.startsWith('mc') ? 'Metacognicion'
                     : 'General';
        const words  = val.split(/\s+/).filter(Boolean).length;
        GENCODE_API.saveResponse(st.code, st.code, st.name, semana, field, field, val, words);
      }
    });
  };

  console.log('[GENCODE-SHEETS] ✅ Sincronización con Google Sheets activada.');
});
