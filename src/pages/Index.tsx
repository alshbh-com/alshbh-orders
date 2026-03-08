import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import {
  Store, ShoppingCart, Bell, Palette, Zap, Shield,
  Globe, Smartphone, Search, Star, Package, TrendingUp,
  Share2, Copy, Check
} from "lucide-react";
import { useState } from "react";

const features = [
  { icon: Zap, title: "اعمل متجرك في دقايق", desc: "سجل واختار قالب وابدأ بيع منتجاتك فورًا" },
  { icon: Package, title: "ضيف منتجاتك بسهولة", desc: "ارفع صور وحط الأسعار والوصف في ثواني" },
  { icon: ShoppingCart, title: "استقبل طلباتك", desc: "العملاء يطلبوا والطلبات توصلك لحظيًا" },
  { icon: Bell, title: "إشعارات فورية", desc: "اعرف بكل طلب جديد في نفس اللحظة" },
  { icon: Palette, title: "قوالب جاهزة", desc: "4 قوالب مختلفة: مطاعم، ملابس، عطور، سوبر ماركت" },
  { icon: Globe, title: "رابط خاص لمتجرك", desc: "متجرك على alshbh.store/store/اسم-متجرك" },
  { icon: Smartphone, title: "متوافق مع الموبايل", desc: "متجرك يشتغل على كل الأجهزة بشكل ممتاز" },
  { icon: Search, title: "بحث وفلتر", desc: "عملائك يلاقوا اللي عايزينه بسرعة" },
  { icon: Star, title: "تقييمات المنتجات", desc: "عملائك يقيموا منتجاتك ويزودوا الثقة" },
  { icon: Shield, title: "نظام نقاط ذكي", desc: "ادفع بس لما تستقبل طلبات - كل طلب = نقطة واحدة" },
  { icon: TrendingUp, title: "إحصائيات متجرك", desc: "تابع مبيعاتك وطلباتك من لوحة التحكم" },
  { icon: Store, title: "تخصيص كامل", desc: "غير ألوان متجرك وخليه يعبر عن براندك" },
];

const packages = [
  { points: 100, price: 100 },
  { points: 200, price: 200 },
  { points: 300, price: 300 },
  { points: 500, price: 500 },
  { points: 1000, price: 1000 },
];

function ShareButtons({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <a href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" className="gap-2 rounded-full px-5 hover:bg-green-500/10 hover:border-green-500 hover:text-green-600">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          واتساب
        </Button>
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" className="gap-2 rounded-full px-5 hover:bg-blue-500/10 hover:border-blue-500 hover:text-blue-600">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          فيسبوك
        </Button>
      </a>
      <a href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" className="gap-2 rounded-full px-5 hover:bg-sky-500/10 hover:border-sky-500 hover:text-sky-600">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          تويتر / X
        </Button>
      </a>
      <a href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" className="gap-2 rounded-full px-5 hover:bg-blue-400/10 hover:border-blue-400 hover:text-blue-500">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          تليجرام
        </Button>
      </a>
      <Button variant="outline" className="gap-2 rounded-full px-5" onClick={copyLink}>
        {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
        {copied ? "تم النسخ! ✅" : "انسخ الرابط"}
      </Button>
    </div>
  );
}

export default function Index() {
  const whatsappUrl = "https://wa.me/201061067966?text=" + encodeURIComponent("أريد شحن نقاط لمنصة الشبح ميديا Alshbh Media");

  useEffect(() => {
    const visitorId = localStorage.getItem('visitor_id') || crypto.randomUUID();
    localStorage.setItem('visitor_id', visitorId);
    supabase.from("page_views").insert({
      page_path: "/",
      visitor_id: visitorId,
    }).then(() => {});
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-primary/10 via-background to-accent/5 py-20 md:py-32">
        <div className="container text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Store className="h-4 w-4" />
            منصة المتاجر الإلكترونية الأولى في مصر
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            اعمل <span className="text-primary">متجرك</span> في دقايق
            <br />
            واستقبل طلباتك بسهولة
          </h1>
          <p className="mx-auto max-w-2xالشبح ميديا (Alshbh Media)-lg text-muted-foregroالشبح ميديا (Alshbh Media)-8">
            مع ALSHBH هتقدر تعمل متجرك الإلكتروني وتعرض منتجاتك وتستقبل طلبات عملائك — كل ده من غير ما تحتاج أي خبرة تقنية
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard">
              <Button size="lg" className="text-lg px-8 py-6">يلا نبدأ - مجاناً! 🚀</Button>
            </Link>
            <Link to="/about">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">اعرف أكتر</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">ليه الشبح ميديا؟</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">كل اللي محتاجه عشان تبدأ تبيع أونلاين</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="group hover:shadow-lg hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">باقات النقاط</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">كل طلب = نقطة واحدة بس — اختار الباقة اللي تناسبك</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            {packages.map((p) => (
              <Card key={p.points} className="text-center hover:shadow-lg hover:border-primary/40 transition-all">
                <CardContent className="p-6">
                  <div className="text-3xl font-extrabold text-primary mb-1">{p.points}</div>
                  <div className="text-sm text-muted-foreground mb-3">نقطة</div>
                  <div className="text-xl font-bold mb-4">{p.price} جنيه</div>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="w-full">اشحن دلوقتي</Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            عايز باقة مخصصة؟{" "}
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">كلمنا على الواتساب</a>
          </p>
        </div>
      </section>

      {/* FAQ Section for SEO */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">أسئلة شائعة عن منصة الشبح ميديا Alshbh Media</h2>
          <div className="space-y-6">
            {[
              { q: "إيه هي منصة الشبح ميديا Alshbh Media؟", a: "الشبح ميديا (Alshbh Media) هي منصة مصرية لإنشاء المتاجر الإلكترونية. تقدر تعمل متجرك الخاص في دقايق وتبدأ تبيع أونلاين من غير ما تحتاج أي خبرة تقنية. بديل سلة وزد المصري." },
              { q: "كم تكلفة إنشاء متجر إلكتروني على الشبح ميديا؟", a: "إنشاء المتجر مجاني تماماً! بتدفع بس لما تستقبل طلبات من خلال نظام النقاط - كل طلب = نقطة واحدة = جنيه واحد. مفيش اشتراكات شهرية أو رسوم خفية." },
              { q: "إزاي أعمل متجر إلكتروني على الشبح ميديا؟", a: "سجل حساب جديد بجوجل أو بالإيميل، اختار قالب متجرك (مطاعم، ملابس، عطور، سوبر ماركت)، ضيف منتجاتك بالصور والأسعار، وشارك رابط متجرك. الموضوع مش بياخد أكتر من 5 دقايق." },
              { q: "هل منصة Alshbh Media بتدعم إيزي أوردر Easy Order؟", a: "أيوا! الشبح ميديا بتوفرلك نظام طلبات سهل وبسيط. العملاء يقدروا يطلبوا من متجرك بسهولة، وانت تستقبل الطلبات وتتابعها من لوحة التحكم." },
              { q: "إيه المميزات اللي بتقدمها الشبح ميديا؟", a: "قوالب جاهزة، نظام طلبات متكامل، كوبونات خصم، تقييمات المنتجات، إحصائيات المبيعات، رابط خاص لمتجرك على alshbh.store، ودعم كامل للموبايل." },
            ].map((faq, i) => (
              <details key={i} className="group rounded-xl border border-border bg-card p-5 cursor-pointer">
                <summary className="font-bold text-lg list-none flex justify-between items-center">
                  <span>{faq.q}</span>
                  <span className="text-primary group-open:rotate-45 transition-transform text-2xl">+</span>
                </summary>
                <p className="mt-4 text-muted-foreground leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Share Section */}
      <section className="py-12 bg-muted/50">
        <div className="container text-center">
          <h2 className="text-2xl font-bold mb-3">شارك الشبح ميديا مع صحابك 🚀</h2>
          <p className="text-muted-foreground mb-6">ساعدنا نوصل لناس أكتر — شير الموقع على السوشيال!</p>
          <ShareButtons url="https://alshbh.store" text="اعرف منصة الشبح ميديا Alshbh Media — أسهل طريقة تعمل بيها متجرك الإلكتروني في مصر مجاناً! 🔥" />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">جاهز تبدأ متجرك الإلكتروني؟</h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">سجل دلوقتي واعمل متجرك الإلكتروني في أقل من 5 دقايق - مجاناً مع الشبح ميديا Alshbh Media</p>
          <Link to="/dashboard">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">يلا ابدأ مجاناً! 💪</Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
