package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// Mall 商场信息
type Mall struct {
	ID      int     `json:"id"`
	Name    string  `json:"name"`
	Address string  `json:"address"`
	Lat     float64 `json:"lat"`
	Lng     float64 `json:"lng"`
}

// Checkin 打卡记录
type Checkin struct {
	ID          int       `json:"id"`
	MallID      int       `json:"mall_id"`
	MallName    string    `json:"mall_name"`
	MallAddress string    `json:"mall_address"`
	UserLat     float64   `json:"user_lat"`
	UserLng     float64   `json:"user_lng"`
	DistanceM   float64   `json:"distance_m"`
	Time        time.Time `json:"time"`
}

// 内置示例商场（坐标为演示用近似值，可按需增改）
var seedMalls = []Mall{
	{ID: 1, Name: "北京SKP", Address: "北京市朝阳区建国路87号", Lat: 39.9109, Lng: 116.4660},
	{ID: 2, Name: "上海环球港", Address: "上海市普陀区中山北路3300号", Lat: 31.2342, Lng: 121.4071},
	{ID: 3, Name: "广州天河城", Address: "广州市天河区天河路208号", Lat: 23.1323, Lng: 113.3210},
	{ID: 4, Name: "成都IFS", Address: "成都市锦江区红星路三段1号", Lat: 30.6554, Lng: 104.0807},
	{ID: 5, Name: "深圳万象城", Address: "深圳市罗湖区宝安南路1881号", Lat: 22.5469, Lng: 114.1064},
}

// Store 数据存储：内存 + JSON 文件持久化
type Store struct {
	mu       sync.Mutex
	malls    []Mall
	checkins []Checkin
	file     string
	nextID   int
}

// NewStore 创建存储，并从文件加载历史打卡记录
func NewStore(file string) *Store {
	s := &Store{
		malls:  seedMalls,
		file:   file,
		nextID: 1,
	}
	s.load()
	return s
}

func (s *Store) load() {
	data, err := os.ReadFile(s.file)
	if err != nil {
		return // 首次运行，无历史数据
	}
	if err := json.Unmarshal(data, &s.checkins); err != nil {
		return
	}
	for _, c := range s.checkins {
		if c.ID >= s.nextID {
			s.nextID = c.ID + 1
		}
	}
}

func (s *Store) save() error {
	if s.file == "" {
		return nil
	}
	if err := os.MkdirAll(filepath.Dir(s.file), 0o755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(s.checkins, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.file, data, 0o644)
}

func (s *Store) Malls() []Mall {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]Mall, len(s.malls))
	copy(out, s.malls)
	return out
}

func (s *Store) GetMall(id int) (Mall, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, m := range s.malls {
		if m.ID == id {
			return m, true
		}
	}
	return Mall{}, false
}

func (s *Store) AddCheckin(c *Checkin) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	c.ID = s.nextID
	s.nextID++
	s.checkins = append(s.checkins, *c)
	return s.save()
}

func (s *Store) Checkins() []Checkin {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]Checkin, len(s.checkins))
	copy(out, s.checkins)
	return out
}
