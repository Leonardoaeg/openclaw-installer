/**
 * Meta Data Deletion Status Page
 *
 * Meta redirects users here after requesting data deletion.
 * The URL includes ?id=confirmation_code so users can verify their request.
 * This page must be publicly accessible (no auth required).
 */
import { Suspense } from "react";

function DeletionStatusContent({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const confirmationCode = searchParams.id ?? "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Solicitud de eliminación recibida</h1>
          <p className="text-muted-foreground">
            Hemos recibido tu solicitud para eliminar los datos de tu cuenta de
            Meta de AgenteFlow. Todos los tokens de acceso y datos asociados han
            sido eliminados de nuestros sistemas.
          </p>
        </div>

        {confirmationCode && (
          <div className="rounded-lg border bg-muted/50 p-4 text-left space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Código de confirmación
            </p>
            <p className="text-sm font-mono break-all">{confirmationCode}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Si tienes preguntas sobre tus datos, contáctanos en{" "}
          <a
            href="mailto:hola@agenteflow.online"
            className="underline underline-offset-2"
          >
            hola@agenteflow.online
          </a>
        </p>
      </div>
    </div>
  );
}

export default function DeletionStatusPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  return (
    <Suspense>
      <DeletionStatusContent searchParams={searchParams} />
    </Suspense>
  );
}
