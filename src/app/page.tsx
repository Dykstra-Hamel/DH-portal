import Image from "next/image";
import styles from "./styles/page.module.scss";
import Auth from "@/components/Auth";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/icon-192x192.png"
          alt="DH Portal logo"
          width={150}
          height={150}
          priority
        />
        <Auth />
        </main>
    </div>
  );
}
