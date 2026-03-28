export const metadata = {
  title: "Política de Privacidad — AgenteFlow",
  description:
    "Cómo AgenteFlow recopila, usa y protege tu información personal y los datos de Meta Ads.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-10">
        {/* Header */}
        <div className="space-y-3 border-b pb-8">
          <h1 className="text-4xl font-bold">Política de Privacidad</h1>
          <p className="text-muted-foreground">
            Última actualización: 28 de marzo de 2025
          </p>
          <p className="text-muted-foreground leading-relaxed">
            En <strong>AgenteFlow</strong> nos tomamos en serio tu privacidad.
            Esta Política de Privacidad explica qué información recopilamos,
            cómo la usamos, con quién la compartimos y cuáles son tus derechos
            al respecto. Aplica a todos los usuarios de{" "}
            <strong>agenteflow.online</strong>.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            1. Información que recopilamos
          </h2>

          <h3 className="text-lg font-medium">1.1 Información de cuenta</h3>
          <p className="text-muted-foreground leading-relaxed">
            Al registrarte recopilamos: nombre, dirección de correo electrónico
            y contraseña (almacenada con hash seguro). Si te registras mediante
            Google u otro proveedor OAuth, recibimos la información básica de
            perfil que ese proveedor comparte.
          </p>

          <h3 className="text-lg font-medium">1.2 Datos de Meta Ads</h3>
          <p className="text-muted-foreground leading-relaxed">
            Cuando conectas tu cuenta de Meta, recopilamos y almacenamos:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc list-inside ml-2">
            <li>
              <strong>Token de acceso OAuth</strong> — para consultar la API de
              Meta en tu nombre (token de larga duración, válido ~60 días)
            </li>
            <li>
              <strong>ID de cuenta publicitaria</strong> — para identificar qué
              cuenta gestiona AgenteFlow
            </li>
            <li>
              <strong>Métricas de campañas</strong> — gasto, impresiones, clics,
              conversiones, ROAS, CTR, CPC
            </li>
            <li>
              <strong>Información de campañas</strong> — nombres, estados,
              presupuestos, fechas
            </li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            No accedemos a información personal de los usuarios de tus anuncios
            ni a datos fuera del alcance de los permisos que otorgas.
          </p>

          <h3 className="text-lg font-medium">1.3 Datos de uso del servicio</h3>
          <p className="text-muted-foreground leading-relaxed">
            Recopilamos automáticamente información técnica como dirección IP,
            tipo de navegador, páginas visitadas dentro de la plataforma, fecha
            y hora de acceso. Esto nos ayuda a mejorar el Servicio y detectar
            problemas.
          </p>

          <h3 className="text-lg font-medium">1.4 Comunicaciones</h3>
          <p className="text-muted-foreground leading-relaxed">
            Si nos contactas por correo o formulario, guardamos tu mensaje para
            poder responderte y hacer seguimiento.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            2. Cómo usamos tu información
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Usamos la información recopilada para:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc list-inside ml-2">
            <li>Proveer, operar y mantener el Servicio</li>
            <li>
              Analizar el rendimiento de tus campañas y generar recomendaciones
              con IA
            </li>
            <li>
              Enviarte alertas configuradas (por ejemplo, cuando una campaña
              supera el presupuesto)
            </li>
            <li>Gestionar tu cuenta, suscripción y facturación</li>
            <li>
              Enviarte comunicaciones sobre el Servicio (actualizaciones,
              mejoras, avisos de seguridad)
            </li>
            <li>
              Detectar y prevenir fraude, abuso o actividades no autorizadas
            </li>
            <li>Cumplir con obligaciones legales y regulatorias</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            No usamos tus datos de Meta Ads para entrenar modelos de IA de
            terceros ni para fines publicitarios propios.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            3. Base legal para el tratamiento
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Tratamos tus datos con las siguientes bases legales:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc list-inside ml-2">
            <li>
              <strong>Ejecución del contrato</strong> — para prestarte el
              Servicio contratado
            </li>
            <li>
              <strong>Consentimiento</strong> — para la conexión con Meta Ads y
              comunicaciones de marketing
            </li>
            <li>
              <strong>Interés legítimo</strong> — para mejorar el Servicio,
              seguridad y prevención de fraude
            </li>
            <li>
              <strong>Obligación legal</strong> — cuando la ley lo requiera
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            4. Compartición de datos con terceros
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            No vendemos ni alquilamos tu información personal. Podemos compartir
            datos únicamente en estos casos:
          </p>

          <h3 className="text-lg font-medium">4.1 Proveedores de servicios</h3>
          <ul className="text-muted-foreground space-y-2 list-disc list-inside ml-2">
            <li>
              <strong>Supabase</strong> — base de datos y autenticación (datos
              almacenados en servidores seguros)
            </li>
            <li>
              <strong>Stripe</strong> — procesamiento de pagos (no acceden a tus
              datos de Meta)
            </li>
            <li>
              <strong>Meta (Facebook)</strong> — para ejecutar las consultas a
              la API de Meta Ads en tu nombre
            </li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            Todos nuestros proveedores están sujetos a acuerdos de
            confidencialidad y solo acceden a los datos necesarios para prestar
            su servicio.
          </p>

          <h3 className="text-lg font-medium">4.2 Obligaciones legales</h3>
          <p className="text-muted-foreground leading-relaxed">
            Podemos divulgar información si así lo exige una ley, resolución
            judicial o autoridad competente, o para proteger los derechos y
            seguridad de AgenteFlow y sus usuarios.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">5. Datos de Meta — detalles</h2>
          <p className="text-muted-foreground leading-relaxed">
            AgenteFlow es una app que utiliza la API de Meta bajo sus Políticas
            de la Plataforma. En relación con los datos de Meta:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc list-inside ml-2">
            <li>
              Solo accedemos a los datos para los que otorgaste permiso
              explícitamente durante el flujo OAuth
            </li>
            <li>
              Los tokens de acceso se almacenan cifrados y se usan
              exclusivamente para consultar la API de Meta en tu nombre
            </li>
            <li>
              Puedes revocar el acceso en cualquier momento desde{" "}
              <strong>
                Facebook → Configuración → Seguridad → Aplicaciones y sitios web
              </strong>{" "}
              o desde el panel de AgenteFlow
            </li>
            <li>
              Al revocar el acceso, eliminamos tu token de acceso de nuestros
              sistemas de forma inmediata
            </li>
            <li>
              No transferimos datos de Meta Ads a terceros salvo lo descrito en
              la sección 4
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">6. Seguridad</h2>
          <p className="text-muted-foreground leading-relaxed">
            Implementamos medidas técnicas y organizativas para proteger tu
            información:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc list-inside ml-2">
            <li>Cifrado en tránsito mediante HTTPS/TLS</li>
            <li>Tokens de acceso almacenados de forma segura en base de datos</li>
            <li>Autenticación de dos factores disponible para tu cuenta</li>
            <li>Acceso a datos de producción restringido al equipo técnico esencial</li>
            <li>Monitoreo de accesos y auditoría de operaciones sensibles</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            Ningún sistema es 100% seguro. Si detectas una vulnerabilidad,
            repórtala a{" "}
            <a
              href="mailto:hola@agenteflow.online"
              className="underline underline-offset-2"
            >
              hola@agenteflow.online
            </a>
            .
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">7. Retención de datos</h2>
          <p className="text-muted-foreground leading-relaxed">
            Conservamos tus datos mientras tu cuenta esté activa y durante el
            tiempo necesario para cumplir con obligaciones legales. Cuando
            cancelas tu cuenta:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc list-inside ml-2">
            <li>
              Los tokens de acceso de Meta se eliminan inmediatamente
            </li>
            <li>
              Los datos de métricas y campañas se eliminan en un plazo de 30
              días
            </li>
            <li>
              Los registros de facturación se conservan por el tiempo que exija
              la ley (generalmente 5 años)
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">8. Tus derechos</h2>
          <p className="text-muted-foreground leading-relaxed">
            Según la legislación aplicable, puedes ejercer los siguientes
            derechos sobre tus datos:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc list-inside ml-2">
            <li>
              <strong>Acceso</strong> — solicitar una copia de los datos que
              tenemos sobre ti
            </li>
            <li>
              <strong>Rectificación</strong> — corregir datos inexactos o
              incompletos
            </li>
            <li>
              <strong>Eliminación</strong> — solicitar el borrado de tus datos
              personales
            </li>
            <li>
              <strong>Portabilidad</strong> — recibir tus datos en formato
              estructurado
            </li>
            <li>
              <strong>Oposición</strong> — oponerte al tratamiento basado en
              interés legítimo
            </li>
            <li>
              <strong>Retirar el consentimiento</strong> — en cualquier momento,
              sin afectar la licitud del tratamiento previo
            </li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            Para ejercer cualquiera de estos derechos, escríbenos a{" "}
            <a
              href="mailto:hola@agenteflow.online"
              className="underline underline-offset-2"
            >
              hola@agenteflow.online
            </a>
            . Responderemos en un plazo máximo de 30 días.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">9. Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            Usamos cookies estrictamente necesarias para la autenticación y el
            funcionamiento del Servicio (sesión de usuario, preferencias de
            idioma). No usamos cookies de rastreo publicitario de terceros.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            10. Cambios a esta Política
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Podemos actualizar esta Política ocasionalmente. Los cambios
            significativos serán notificados por correo electrónico con al menos
            15 días de anticipación. La fecha de "última actualización" al inicio
            del documento indica cuándo fue modificada por última vez.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">11. Contacto</h2>
          <p className="text-muted-foreground leading-relaxed">
            Si tienes preguntas, solicitudes o inquietudes sobre esta Política de
            Privacidad o el tratamiento de tus datos, contáctanos:
          </p>
          <div className="rounded-lg border bg-muted/40 p-4 space-y-1 text-sm text-muted-foreground">
            <p><strong>AgenteFlow — Responsable de Protección de Datos</strong></p>
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
