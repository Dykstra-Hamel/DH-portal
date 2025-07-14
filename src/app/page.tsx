import styles from "./styles/page.module.scss";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Link href='/login'>Login</Link>
      </main>
    </div>
  );
}
