// frontend/src/contentScript.js
(function () {
  if (window.__STUDY_ASSISTANT_CONTENT_SCRIPT_LOADED__) return;
  window.__STUDY_ASSISTANT_CONTENT_SCRIPT_LOADED__ = true;

  async function record(data) {
    try {
      const payload = data || {};
      const sentence = payload?.sentence ?? payload?.answer ?? payload?.text ?? '';
      console.info('[contentScript] record called. sentence length:', (sentence && sentence.length) || 0);
      const eventDetail = { sentence, raw: payload, timestamp: Date.now() };
      window.dispatchEvent(new CustomEvent('StudyAssistantContentRecord', { detail: eventDetail }));
      return { ok: true, sentence, raw: payload };
    } catch (err) {
      console.error('[contentScript] record() failed:', err);
      return { ok: false, error: String(err) };
    }
  }

  window.StudyAssistantContent = window.StudyAssistantContent || {};
  window.StudyAssistantContent.record = record;

  if (!window.record && window.StudyAssistantContent?.record) {
    window.record = window.StudyAssistantContent.record;
  }

  console.log('[contentScript] placeholder loaded.');
})();
