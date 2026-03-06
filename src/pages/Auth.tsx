import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";

// Save referral code from URL to localStorage

export default function Auth() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: "تمام يسطا! 🎉", description: "بصلي الإيميل بتاعك هتلاقي لينك عشان تغير الباسورد" });
        setMode("login");
      } else if (mode === "login") {
        await signIn(email, password);
        navigate("/dashboard");
      } else {
        await signUp(email, password, fullName);
        toast({ title: "تمام يا بطل! 🎉", description: "روح شيك على الإيميل بتاعك عشان تأكد الحساب وبعدها ادخل عادي" });
      }
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes("Invalid login")) msg = "الإيميل أو الباسورد غلط يسطا، جرب تاني";
      if (msg.includes("already registered")) msg = "الإيميل ده مسجل قبل كده، جرب تسجل دخول";
      toast({ title: "أوبس! 😅", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "حصلت مشكلة مع جوجل 😕", description: error.message, variant: "destructive" });
      setGoogleLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Store className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              {mode === "login" ? "أهلاً بيك يسطا! 👋" : mode === "register" ? "يلا نعملك حساب! 🚀" : "نسيت الباسورد؟ عادي! 😄"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "سجل دخول وكمّل شغلك — متجرك مستنيك"
                : mode === "register"
                ? "سجل في ثانيتين وابدأ اعمل متجرك مجاناً"
                : "اكتب الإيميل بتاعك وهنبعتلك لينك تغير بيه الباسورد"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode !== "forgot" && (
              <>
                {/* Google Sign-In Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 text-base gap-3 border-2 hover:bg-muted/50"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )}
                  {googleLoading ? "ثانية يسطا..." : "ادخل بحساب جوجل 🔥"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">أو بالإيميل</span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">اسمك إيه يا اخويا؟</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="محمد أحمد" required />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">الإيميل بتاعك</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required dir="ltr" />
              </div>
              {mode !== "forgot" && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password">الباسورد</Label>
                    {mode === "login" && (
                      <button type="button" onClick={() => setMode("forgot")} className="text-xs text-primary hover:underline">
                        نسيت الباسورد؟
                      </button>
                    )}
                  </div>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required dir="ltr" />
                </div>
              )}
              <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                {loading ? "ثانية واحدة يسطا..." : mode === "login" ? "يلا ادخل! 🚀" : mode === "register" ? "اعمل حسابي! 🎉" : "ابعتلي اللينك 📧"}
              </Button>
            </form>

            <div className="text-center text-sm space-y-1">
              {mode === "forgot" ? (
                <button type="button" onClick={() => setMode("login")} className="text-primary hover:underline flex items-center justify-center gap-1 mx-auto">
                  <ArrowRight className="h-3 w-3" /> رجوع لتسجيل الدخول
                </button>
              ) : (
                <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-primary hover:underline">
                  {mode === "login" ? "مش عندك حساب؟ يلا سجل في ثانيتين! 💪" : "عندك حساب؟ ادخل من هنا"}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
