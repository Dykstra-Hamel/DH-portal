import styles from "../styles/page.module.scss";

export default async function DashboardPage() {

    return (
        <div className={styles.page}>
            <main className={styles.main}>
                <h1>This is a dashboard.</h1>
            </main>
        </div>
    )
}