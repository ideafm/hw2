import { from, fromEvent, merge, Observable, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';

const baseURL: string = 'https://api.github.com/search/repositories';

const input: HTMLInputElement = document.getElementById('input') as HTMLInputElement;
const list: HTMLInputElement = document.getElementById('list') as HTMLInputElement;
const total: HTMLInputElement = document.getElementById('total') as HTMLInputElement;

const input$: Observable<Event> = fromEvent(input, 'input');
const focus$: Observable<Event> = fromEvent(input, 'focus');
const blur$: Observable<Event> = fromEvent(input, 'blur');

type RepositoryItemType = {
    forks: number;
    forks_count: number;
    html_url: string;
    id: number;
    name: string;
    open_issues_count: number;
    owner: {
        avatar_url: string;
        events_url: string;
        followers_url: string;
        following_url: string;
        gists_url: string;
        gravatar_id: string;
        html_url: string;
        id: number;
        login: string;
        node_id: string;
        organizations_url: string;
        received_events_url: string;
        repos_url: string;
        site_admin: boolean;
        starred_url: string;
        subscriptions_url: string;
        type: string;
        url: string;
    };
    stargazers_count: number;
    watchers: number;
    watchers_count: number;
};

type ResultType = {
    total: number,
    items: RepositoryItemType[]
};

const render = (res: ResultType): void => {
    let html = '';
    res.items.forEach((item: RepositoryItemType): void => {
        html += `<div class="item">
            <div class="item__title">
                <a href="${item.html_url}" target="_blank">${item.name}</a>
            </div>
            <div class="item__owner">
                <a href="${item.owner.url}" target="_blank">${item.owner.login}</a>
            </div>
            <div class="item__footer">
                <div>
                    <div>Stars</div>
                    <em>${item.stargazers_count}</em>
                </div>
                <div>
                    <div>Forks</div>
                    <em>${item.forks_count}</em>
                </div>
                <div>
                    <div>Open Issues</div>
                    <em>${item.open_issues_count}</em>
                </div>
            </div>
        </div>`;
    });
    list.innerHTML = html;
    total.innerHTML = res.total.toString();
};

const stream$: Observable<ResultType | Error> = merge(input$, focus$, blur$).pipe(
    debounceTime(400),
    distinctUntilChanged(),
    filter( (e: Event): boolean => {
        return e.type !== 'focus';
    }),
    switchMap((e: Event): Observable<ResultType | Error> => {
        const q: string = (e.target as HTMLInputElement).value.replace(' ', '+');
        const query: string = `?q=${q}+language:javascript&sort=stars`;
        return from(
            fetch(`${baseURL}${query}`)
                .then(res => res.json())
                .then(res => res))
            .pipe(
                map(res => {
                    const mapped = res.items.map((item: RepositoryItemType) => ({
                        forks: item.forks,
                        forks_count: item.forks_count,
                        html_url: item.html_url,
                        id: item.id,
                        name: item.name,
                        open_issues_count: item.open_issues_count,
                        owner: item.owner,
                        stargazers_count: item.stargazers_count,
                        watchers: item.watchers,
                        watchers_count: item.watchers_count,
                    }));
                    return {
                        total: res.total_count,
                        items: mapped
                    };
                }),
                catchError(_e => of(new Error(_e)))
        );
    }),
);
stream$.subscribe(res => {
    if (res instanceof Error) {
        console.error(res);
        return false;
    }
    return render(res);
});
