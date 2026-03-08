import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("complaints").insert({ name, email, phone, message });
    if (error) {
      toast({ title: "حصل مشكلة", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم الإرسال!", description: "هنرد عليك في أقرب وقت" });
      setName(""); setEmail(""); setPhone(""); setMessage("");
    }
    setLoading(false);
  };

  const whatsappUrl = "https://wa.me/201061067966?text=" + encodeURIComponent("عايز أستفسر عن منصة الشبح ميديا Alshbh Media");

  return (
    <Layout>
      <div className="container py-16 max-w-2xl">
        <h1 className="text-4xl font-bold mb-2">تواصل معانا</h1>
        <p className="text-muted-foreground mb-8">عندك سؤال أو استفسار؟ ابعتلنا وهنرد عليك</p>

        <div className="mb-8">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="w-full gap-2">
              <MessageCircle className="h-5 w-5" />
              كلمنا على الواتساب
            </Button>
          </a>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ابعتلنا رسالة</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>الاسم</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الإيميل</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label>الموبايل</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>الرسالة</Label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="اكتب رسالتك هنا..." rows={5} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <Send className="ml-2 h-4 w-4" />
                {loading ? "بيتبعت..." : "ابعت"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
