import styles from "./index.module.scss"

export default function StartPage() {
    return(
        <div className={styles.container}>
            <p>helicopter simulator</p>
            <button>Start</button>
        </div>
    )
}