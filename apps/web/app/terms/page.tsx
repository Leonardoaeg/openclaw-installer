export const metadata = {
  title: "Términos de Servicio — AgenteFlow",
  description:
    "Lee los términos y condiciones que rigen el uso de la plataforma AgenteFlow.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-10">
        {/* Header */}
        <div className="space-y-3 border-b pb-8">
          <h1 className="text-4xl font-bold">Términos de Servicio</h1>
          <p className="text-muted-foreground">
            Última actualización: 28 de marzo de 2025
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Bienvenido a <strong>AgenteFlow</strong>. Estos Términos de Servicio
            ("Términos") regulan el acceso y uso de nuestra plataforma de
            marketing digital con inteligencia artificial, disponible en{" "}
            <strong>agenteflow.online</strong> ("el Servicio"), operada por
            AgenteFlow ("nosotros", "nos" o "nuestro").
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Al registrarte o utilizar el Servicio, aceptas quedar vinculado por
            estos Términos. Si representas a una empresa, confirmas que tienes
            autoridad para aceptarlos en su nombre.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">1. Descripción del Servicio</h2>
          <p className="text-muted-foreground leading-relaxed">
            AgenteFlow es una plataforma SaaS de marketing digital que utiliza
            inteligencia artificial para ayudar a negocios y agencias a gestionar,
            analizar y optimizar campañas publicitarias en Meta (Facebook e
            Instagram Ads). El Servicio incluye:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc list-inside ml-2">
            <li>Conexión OAuth con cuentas de Meta Business</li>
            <li>Análisis de métricas de campañas en tiempo real</li>
            <li>Recomendaciones y alertas generadas por IA</li>
            <li>Gestión de presupuestos y activación/pausa de campañas</li>
            <li>Reportes y paneles de control personalizados</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">2. Registro y Cuenta</h2>
          <p className="text-muted-foreground leading-relaxed">
            Para usar el Servicio debes crear una cuenta proporcionando
            información veraz y actualizada. Eres responsable de:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc list-inside ml-2">
            <li>
              Mantener la confidencialidad de tus credenciales de acceso
            </li>
            <li>
              Todas las actividades que ocurran bajo tu cuenta
            </li>
            <li>
              Notificarnos inmediatamente en caso de acceso no autorizado a{" "}
              <a
                href="mailto:hola@agenteflow.online"
                className="underline underline-offset-2"
              >
                hola@agenteflow.online
              </a>
            </li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            Nos reservamos el derecho de suspender cuentas que violen estos
            Términos o que se usen de forma fraudulenta.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">3. Conexión con Meta Ads</h2>
          <p className="text-muted-foreground leading-relaxed">
            Al conectar tu cuenta de Meta Ads a través de nuestro proceso OAuth,
            autorizas a AgenteFlow a:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc list-inside ml-2">
            <li>Leer métricas e información de tus campañas publicitarias</li>
            <li>Activar y pausar campañas según tus instrucciones</li>
            <li>
              Acceder a información de tus cuentas publicitarias asociadas
            </li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            Esta autorización es tuya y la puedes revocar en cualquier momento
            desde la configuración de tu cuenta de Facebook o desde el panel de
            AgenteFlow. AgenteFlow no realiza ninguna acción en tu cuenta de
            Meta sin tu instrucción o configuración previa.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            El uso de los datos de Meta se rige adicionalmente por las{" "}
            <a
              href="https://developers.facebook.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Políticas de la Plataforma de Meta
            </a>
            .
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">4. Planes y Pagos</h2>
          <p className="text-muted-foreground leading-relaxed">
            AgenteFlow ofrece planes de suscripción mensuales y anuales. Al
            suscribirte:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc list-inside ml-2">
            <li>
              Autorizas el cobro recurrente mediante el método de pago
              registrado
            </li>
            <li>
              Los precios pueden cambiar con 30 días de aviso previo por correo
            </li>
            <li>
              No se realizan reembolsos por períodos parciales, salvo que la ley
              aplicable lo exija
            </li>
            <li>
              La cancelación entra en efecto al final del período de facturación
              actual
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">5. Uso Aceptable</h2>
          <p className="text-muted-foreground leading-relaxed">
            Te comprometes a no usar el Servicio para:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc list-inside ml-2">
            <li>
              Violar leyes o regulaciones aplicables, incluyendo las normas
              publicitarias de Meta
            </li>
            <li>
              Publicar anuncios de productos o servicios prohibidos por Meta o
              por la ley
            </li>
            <li>
              Acceder a cuentas de Meta de terceros sin autorización expresa
            </li>
            <li>Realizar ingeniería inversa o intentar comprometer el sistema</li>
            <li>Revender o sublicenciar el acceso al Servicio sin autorización</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">6. Propiedad Intelectual</h2>
          <p className="text-muted-foreground leading-relaxed">
            El Servicio, incluyendo su código, diseño, logotipos y contenido
            generado por la IA de AgenteFlow, es propiedad de AgenteFlow y está
            protegido por leyes de propiedad intelectual. No adquieres ningún
            derecho de propiedad sobre el Servicio al utilizarlo.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Los datos de tus campañas y métricas pertenecen a ti. AgenteFlow los
            utiliza únicamente para prestarte el Servicio.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            7. Limitación de Responsabilidad
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            AgenteFlow se proporciona "tal cual" y "según disponibilidad". No
            garantizamos que:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc list-inside ml-2">
            <li>El Servicio sea ininterrumpido o libre de errores</li>
            <li>
              Los resultados de las recomendaciones de IA sean siempre precisos
            </li>
            <li>
              Los resultados de las campañas cumplan expectativas de negocio
              específicas
            </li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            En ningún caso la responsabilidad total de AgenteFlow excederá el
            importe pagado por el Servicio en los últimos 12 meses. No somos
            responsables de pérdidas indirectas, daños emergentes ni lucro
            cesante.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">8. Terminación</h2>
          <p className="text-muted-foreground leading-relaxed">
            Puedes cancelar tu cuenta en cualquier momento desde el panel de
            configuración. Nos reservamos el derecho de suspender o terminar el
            acceso si se violan estos Términos, con o sin previo aviso según la
            gravedad de la infracción.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Tras la terminación, eliminaremos tus datos según lo establecido en
            nuestra{" "}
            <a href="/privacy" className="underline underline-offset-2">
              Política de Privacidad
            </a>
            .
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">9. Modificaciones a los Términos</h2>
          <p className="text-muted-foreground leading-relaxed">
            Podemos modificar estos Términos en cualquier momento. Te
            notificaremos los cambios materiales por correo electrónico con al
            menos 15 días de antelación. El uso continuado del Servicio tras la
            fecha de vigencia de los cambios implica la aceptación de los nuevos
            Términos.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">10. Ley Aplicable</h2>
          <p className="text-muted-foreground leading-relaxed">
            Estos Términos se rigen por las leyes aplicables al lugar de
            constitución de AgenteFlow. Cualquier disputa se someterá a la
            jurisdicción exclusiva de los tribunales competentes de dicho
            territorio.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">11. Contacto</h2>
          <p className="text-muted-foreground leading-relaxed">
            Si tienes preguntas sobre estos Términos de Servicio, contáctanos:
          </p>
          <div className="rounded-lg border bg-muted/40 p-4 space-y-1 text-sm text-muted-foreground">
            <p><strong>AgenteFlow</strong></p>
            <p>
              Email:{" "}
              <a
                href="mailto:hola@agenteflow.online"
                className="underline underline-offset-2"
              >
                hola@agenteflow.online
              </a>
            </p>
            <p>Web: agenteflow.online</p>
          </div>
        </section>
      </div>
    </div>
  );
}
