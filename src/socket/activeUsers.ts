class ActiveUsers {
    private static instance: ActiveUsers;
    private users: Set<string>;

    private constructor() {
        this.users = new Set<string>();
    }

    public static getInstance(): ActiveUsers {
        if (!ActiveUsers.instance) {
            ActiveUsers.instance = new ActiveUsers();
        }
        return ActiveUsers.instance;
    }

    public addUser(username: string): void {
        this.users.add(username);
    }

    public hasUser(username: string): boolean {
        return this.users.has(username);
    }

    public removeUser(username: string): void {
        this.users.delete(username);
    }

    public getUsers(): Set<string> {
        return this.users;
    }
}

export const activeUsers = ActiveUsers.getInstance();
