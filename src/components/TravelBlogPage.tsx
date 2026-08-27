import { ArrowLeft, Camera, ChevronRight, Lightbulb, MapPin, Search, Utensils } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import TripiAssistant from './TripiAssistant';
import { SiteBottomNav, SiteHeader } from './SiteChrome';
import { useLanguage } from '../lib/i18n';
import { getTravelArticle } from '../lib/travelContent';

export default function TravelBlogPage() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const article = getTravelArticle(slug);
  if (!article) return <Navigate to="/" replace />;

  const searchUrl = `/find-deal?destination=${encodeURIComponent(article.destinationCode)}`;

  return <div className="app-shell travel-blog-page">
    <SiteHeader/>

    <main>
      <section className="blog-hero">
        <div className="container blog-container">
          <Link className="blog-back" to="/"><ArrowLeft size={17}/> {t('blog.back')}</Link>
          <div className="blog-hero-grid">
            <div>
              <span className="blog-kicker">TRIPDEAL GUIDE · {article.flag} {article.country}</span>
              <h1>{article.title}</h1>
              <p>{article.subtitle}</p>
              <div className="blog-meta"><span>{article.readTime}</span><span>{article.duration}</span><span>{article.bestFor}</span></div>
            </div>
            <div className="blog-hero-art">{article.hero}</div>
          </div>
        </div>
      </section>

      <div className="container blog-container blog-content">
        <nav className="blog-jump" aria-label="Article sections">
          <a href="#plan"><MapPin size={15}/> {t('blog.plan')}</a>
          <a href="#food"><Utensils size={15}/> {t('blog.food')}</a>
          <a href="#checkin"><Camera size={15}/> {t('blog.checkin')}</a>
          <a href="#tips"><Lightbulb size={15}/> {t('blog.tips')}</a>
        </nav>

        <section id="plan" className="blog-section">
          <div className="blog-section-title"><span>01</span><div><h2>{t('blog.plan')} · {article.duration}</h2><p>จัดเป็นโซนเพื่อลดเวลาเดินทางและมีเวลานั่งกิน/พักจริง ๆ</p></div></div>
          <div className="itinerary-grid">
            {article.plan.map((day) => <article className="itinerary-card" key={day.day}>
              <span>{day.day}</span><h3>{day.title}</h3>
              <ul>{day.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>)}
          </div>
        </section>

        <section id="food" className="blog-section">
          <div className="blog-section-title"><span>02</span><div><h2>{t('blog.food')} 🍜</h2><p>ไม่ต้องไล่ร้านไวรัลทุกมื้อ เลือกเมนูเด่นตามย่านที่อยู่จะเที่ยวสบายกว่า</p></div></div>
          <div className="food-grid">
            {article.foods.map((food) => <article className="food-card" key={food.name}>
              <div className="food-icon">🍽️</div><div><h3>{food.name}</h3><strong>{food.area}</strong><p>{food.note}</p></div>
            </article>)}
          </div>
        </section>

        <section id="checkin" className="blog-section split-blog-section">
          <div>
            <div className="blog-section-title"><span>03</span><div><h2>{t('blog.checkin')} 📸</h2><p>เลือก 2–3 จุดหลักต่อวันพอ ที่เหลือปล่อยให้มีเวลาเดินเล่นและเจออะไรระหว่างทาง</p></div></div>
            <div className="checkin-list">{article.checkins.map((place, index) => <div key={place}><b>{String(index + 1).padStart(2, '0')}</b><span>{place}</span></div>)}</div>
          </div>
          <aside className="blog-side-note"><Camera size={24}/><h3>Photo tip</h3><p>สถานที่ยอดนิยมควรไปเช้าหรือก่อนพระอาทิตย์ตก นอกจากแสงสวยแล้วมักเดินง่ายกว่าช่วงกลางวัน</p></aside>
        </section>

        <section id="tips" className="blog-section">
          <div className="blog-section-title"><span>04</span><div><h2>{t('blog.tips')} 💡</h2><p>เช็กเรื่องสำคัญก่อนกดจอง จะช่วยลดค่าใช้จ่ายแฝงและความรีบหน้างาน</p></div></div>
          <div className="tips-grid">{article.tips.map((tip) => <div key={tip}><Lightbulb size={18}/><span>{tip}</span></div>)}</div>
        </section>

        <section className="blog-book-cta">
          <div><span>{t('blog.ready')}</span><h2>{article.city} · TripDeal</h2><p>TripDeal compares options first, then sends you to the airline website for final booking and payment.</p></div>
          <Link to={searchUrl}><Search size={19}/> {t('blog.search')}<ChevronRight size={18}/></Link>
        </section>

        <p className="blog-disclaimer">ข้อมูลเที่ยว ร้านอาหาร ย่าน และการเดินทางในบทความเป็นไกด์สำหรับวางแผนเบื้องต้น เวลาเปิด-ปิด ราคา และข้อกำหนดเข้าประเทศสามารถเปลี่ยนแปลงได้ ควรตรวจข้อมูลล่าสุดจากสถานที่และหน่วยงานทางการก่อนเดินทาง</p>
      </div>
    </main>

    <SiteBottomNav/>
    <TripiAssistant/>
  </div>;
}
