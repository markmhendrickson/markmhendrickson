import { Bot } from 'lucide-react'
import type { SupportedLocale } from '@/i18n/config'

const samples = {
  en: {
    assistantLabel: 'Assistant · Sample data',
    assistantHeading: 'Your AI assistant',
    user: 'You',
    question: 'Which inquiries from this week still need a reply?',
    assistant: 'Assistant',
    answer: 'Three replies are ready for you to approve. They’re in the dashboard’s Today view.',
    dashboardLabel: 'Dashboard · Sample data',
    dashboardHeading: 'Acme Dental · Today',
    pending: '3 replies waiting for approval',
    inquiries: [
      'New-patient inquiry from the web form',
      'WhatsApp question about opening hours',
      'Request to move an appointment',
    ],
    draftLabel: 'Prepared reply · excerpt',
    draft: 'We have room on Tuesday evening and on Thursday evening. Which would suit you?',
  },
  es: {
    assistantLabel: 'Asistente · Datos de ejemplo',
    assistantHeading: 'Tu asistente de IA',
    user: 'Tú',
    question: '¿Qué consultas de esta semana siguen sin respuesta?',
    assistant: 'Asistente',
    answer: 'Tienes tres respuestas listas para aprobar. Están en la vista Hoy del panel.',
    dashboardLabel: 'Panel · Datos de ejemplo',
    dashboardHeading: 'Acme Dental · Hoy',
    pending: '3 respuestas pendientes de aprobación',
    inquiries: [
      'Consulta de un paciente nuevo a través del formulario web',
      'Pregunta por WhatsApp sobre el horario de apertura',
      'Solicitud para cambiar una cita',
    ],
    draftLabel: 'Respuesta preparada · Extracto',
    draft: 'Tenemos disponibilidad el martes y el jueves por la tarde. ¿Qué día le viene mejor?',
  },
}

/** Static excerpts of the inquiry examples on the Constara homepage. */
export function ConstaraInterfaceExamples({ locale }: { locale: SupportedLocale }) {
  const sample = samples[locale === 'es' ? 'es' : 'en']
  return (
    <div className="constara-interface-examples not-prose">
      <figure className="essay-paper-figure">
        <figcaption>
          <span className="essay-paper-label">{sample.assistantLabel}</span>
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
        </figcaption>
        <div className="constara-interface-view">
          <h3 className="constara-interface-bar constara-interface-dashboard-bar">{sample.dashboardHeading}</h3>
          <div className="constara-interface-dashboard">
            <p className="constara-interface-speaker">{sample.pending}</p>
            <ul className="constara-interface-queue">
              {sample.inquiries.map((inquiry, index) => (
                <li key={inquiry} className={index === 0 ? 'constara-interface-focused' : undefined}>
                  {inquiry}
                </li>
              ))}
            </ul>
            <div className="constara-interface-draft">
              <p className="constara-interface-speaker">{sample.draftLabel}</p>
              <p>{sample.draft}</p>
            </div>
          </div>
        </div>
      </figure>
    </div>
  )
}
