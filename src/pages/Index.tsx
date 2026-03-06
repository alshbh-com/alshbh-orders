import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/Layout";
import {
  Store, ShoppingCart, Bell, Palette, Zap, Shield,
  Globe, Smartphone, Search, Star, Package, TrendingUp
} from "lucide-react";

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

export default function Index() {
  const whatsappUrl = "https://wa.me/201061067966?text=" + encodeURIComponent("أريد شحن نقاط لمنصة ALSHBH");

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
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-8">
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
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">ليه ALSHBH؟</h2>
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
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">أسئلة شائعة عن منصة ALSHBH الشبح</h2>
          <div className="space-y-6">
            {[
              { q: "إيه هي منصة ALSHBH الشبح؟", a: "ALSHBH الشبح هي منصة مصرية لإنشاء المتاجر الإلكترونية. تقدر تعمل متجرك الخاص في دقايق وتبدأ تبيع أونلاين من غير ما تحتاج أي خبرة تقنية. بديل سلة وزد المصري." },
              { q: "كم تكلفة إنشاء متجر إلكتروني على الشبح ALSHBH؟", a: "إنشاء المتجر مجاني تماماً! بتدفع بس لما تستقبل طلبات من خلال نظام النقاط - كل طلب = نقطة واحدة = جنيه واحد. مفيش اشتراكات شهرية أو رسوم خفية." },
              { q: "إزاي أعمل متجر إلكتروني على منصة الشبح؟", a: "سجل حساب جديد بجوجل أو بالإيميل، اختار قالب متجرك (مطاعم، ملابس، عطور، سوبر ماركت)، ضيف منتجاتك بالصور والأسعار، وشارك رابط متجرك. الموضوع مش بياخد أكتر من 5 دقايق." },
              { q: "هل منصة ALSHBH بتدعم إيزي أوردر Easy Order؟", a: "أيوا! منصة الشبح ALSHBH بتوفرلك نظام طلبات سهل وبسيط. العملاء يقدروا يطلبوا من متجرك بسهولة، وانت تستقبل الطلبات وتتابعها من لوحة التحكم." },
              { q: "إيه المميزات اللي بتقدمها منصة الشبح؟", a: "قوالب جاهزة، نظام طلبات متكامل، كوبونات خصم، تقييمات المنتجات، إحصائيات المبيعات، رابط خاص لمتجرك على alshbh.store، ودعم كامل للموبايل." },
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

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">جاهز تبدأ متجرك الإلكتروني؟</h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">سجل دلوقتي واعمل متجرك الإلكتروني في أقل من 5 دقايق - مجاناً مع ALSHBH الشبح</p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">ابدأ مجانًا</Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
