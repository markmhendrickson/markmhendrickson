import { Bot } from 'lucide-react'
import type { SupportedLocale } from '@/i18n/config'

const samples = {
  en: {
    assistantLabel: 'Assistant',
    assistantCaption: 'The assistant answers a question about the week from the same record as the dashboard.',
    assistantHeading: 'Your AI assistant',
    user: 'You',
    question: 'Which inquiries from this week still need a reply?',
    assistant: 'Assistant',
    answer: 'One reply is ready for you to approve. It’s in the dashboard’s Today view.',
    dashboardLabel: 'Dashboard',
    dashboardCaption: 'The dashboard holds a prepared reply until a named person approves it. Nothing is sent before that.',
    dashboardHeading: 'Acme Dental · Today',
    inquiryLabel: 'New-patient inquiry · web form',
    inquiry: 'Do you have an appointment free next week for a first visit?',
    draftLabel: 'Prepared reply',
    draft: 'Thank you for getting in touch. We have room on Tuesday evening and on Thursday evening. Which would suit you?',
    approve: 'Approve and send',
  },
  es: {
    assistantLabel: 'Asistente',
    assistantCaption: 'El asistente responde a una pregunta sobre la semana a partir del mismo registro que el panel.',
    assistantHeading: 'Tu asistente de IA',
    user: 'Tú',
    question: '¿Qué consultas de esta semana siguen sin respuesta?',
    assistant: 'Asistente',
    answer: 'Tienes una respuesta lista para aprobar. Está en la vista Hoy del panel.',
    dashboardLabel: 'Panel',
    dashboardCaption: 'El panel mantiene una respuesta preparada hasta que una persona designada la aprueba. No se envía nada antes.',
    dashboardHeading: 'Acme Dental · Hoy',
    inquiryLabel: 'Consulta de un paciente nuevo · Formulario web',
    inquiry: '¿Tienen una cita libre la próxima semana para una primera visita?',
    draftLabel: 'Respuesta preparada',
    draft: 'Gracias por escribirnos. Tenemos disponibilidad el martes y el jueves por la tarde. ¿Qué día le viene mejor?',
    approve: 'Aprobar y enviar',
  },
}

/** Static excerpts of the inquiry examples on the Constara homepage. */
export function ConstaraInterfaceExamples({ locale }: { locale: SupportedLocale }) {
  const sampleLocale = locale === 'es' ? 'es' : 'en'
  const sample = samples[sampleLocale]
  // Locales without translated panel strings show the English panels; mark them
  // as English and left-to-right so RTL pages do not reorder their punctuation.
  const fallback = locale !== sampleLocale
  return (
    <div
      className="constara-interface-examples not-prose"
      lang={fallback ? 'en' : undefined}
      dir={fallback ? 'ltr' : undefined}
    >
      <figure className="essay-paper-figure">
        <figcaption>
          <span className="essay-paper-label">{sample.assistantLabel}</span>
          <span className="constara-interface-caption">{sample.assistantCaption}</span>
        </figcaption>
        <div className="constara-interface-view">
          <h3 className="constara-interface-bar">{sample.assistantHeading}</h3>
          <ol className="constara-interface-chat">
            <li className="constara-interface-user">
              <p className="constara-interface-speaker">{sample.user}</p>
              <p>{sample.question}</p>
            </li>
            <li>
              <p className="constara-interface-speaker"><Bot aria-hidden="true" size={16} /> {sample.assistant}</p>
              <p>{sample.answer}</p>
            </li>
          </ol>
        </div>
      </figure>
      <figure className="essay-paper-figure">
        <figcaption>
          <span className="essay-paper-label">{sample.dashboardLabel}</span>
          <span className="constara-interface-caption">{sample.dashboardCaption}</span>
        </figcaption>
        <div className="constara-interface-view">
          <h3 className="constara-interface-bar constara-interface-dashboard-bar">{sample.dashboardHeading}</h3>
          <div className="constara-interface-dashboard">
            <div className="constara-interface-inquiry">
              <p className="constara-interface-speaker">{sample.inquiryLabel}</p>
              <p>{sample.inquiry}</p>
            </div>
            <div className="constara-interface-draft">
              <p className="constara-interface-speaker">{sample.draftLabel}</p>
              <p>{sample.draft}</p>
            </div>
            <button type="button" className="constara-interface-approve" disabled>
              {sample.approve}
            </button>
          </div>
        </div>
      </figure>
    </div>
  )
}
