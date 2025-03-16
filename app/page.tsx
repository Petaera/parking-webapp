import LoginForm from "@/components/login-form"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Parking Management</h1>
          <p className="mt-2 text-slate-600">Sign in to access your dashboard</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

